import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2, MapPin, Users, Star, Calendar, Clock, User } from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const tourId = params.id;
  
  if (!tourId) {
    throw new Response("Tour ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const tourDate = url.searchParams.get("tourDate");
  const timeSlot = url.searchParams.get("timeSlot");
  const participants = url.searchParams.get("participants");

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    include: {
      guide: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      unavailableDates: {
        where: {
          startDate: { gte: new Date() },
        },
        orderBy: {
          startDate: "asc",
        },
      },
    },
  });

  if (!tour) {
    throw new Response("Tour not found", { status: 404 });
  }

  // Check availability for the requested date and time
  let isAvailable = true;
  let conflictingBookings = [];

  if (tourDate && timeSlot) {
    const tourDateTime = new Date(tourDate);
    
    // Check for conflicting bookings
    conflictingBookings = await prisma.tourBooking.findMany({
      where: {
        tourId: tour.id,
        status: { in: ["CONFIRMED", "PENDING"] },
        tourDate: tourDateTime,
        timeSlot: timeSlot,
      },
    });

    // Check unavailable dates
    const unavailablePeriods = tour.unavailableDates.filter(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      return (
        (periodStart <= tourDateTime && periodEnd >= tourDateTime)
      );
    });

    isAvailable = conflictingBookings.length === 0 && unavailablePeriods.length === 0;
  }

  // Calculate pricing
  let totalPrice = 0;
  let pricingBreakdown = {
    pricePerPerson: tour.pricePerPerson,
    childDiscount: 0,
    groupDiscount: 0,
    extraFees: 0,
    total: 0,
  };

  if (tourDate && participants) {
    const participantCount = parseInt(participants);
    const adults = participantCount; // Simplified for this example
    const children = 0; // Could be calculated from form data
    
    pricingBreakdown.pricePerPerson = tour.pricePerPerson;
    pricingBreakdown.childDiscount = children * (tour.pricePerPerson * 0.5); // 50% discount for children
    pricingBreakdown.groupDiscount = participantCount >= 5 ? (tour.pricePerPerson * participantCount * 0.1) : 0; // 10% group discount for 5+ people
    pricingBreakdown.total = (tour.pricePerPerson * participantCount) - pricingBreakdown.childDiscount - pricingBreakdown.groupDiscount;
    totalPrice = pricingBreakdown.total;
  }

  return json({
    tour,
    isAvailable,
    conflictingBookings,
    pricingBreakdown,
    totalPrice,
    searchParams: {
      tourDate,
      timeSlot,
      participants: participants ? parseInt(participants) : 1,
    },
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const tourId = params.id;
  
  if (!tourId) {
    throw new Response("Tour ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "checkAvailability") {
    const tourDate = formData.get("tourDate") as string;
    const timeSlot = formData.get("timeSlot") as string;

    if (!tourDate || !timeSlot) {
      return json({ error: "Tour date and time slot are required" }, { status: 400 });
    }

    const tourDateTime = new Date(tourDate);

    // Check for conflicting bookings
    const conflictingBookings = await prisma.tourBooking.findMany({
      where: {
        tourId,
        status: { in: ["CONFIRMED", "PENDING"] },
        tourDate: tourDateTime,
        timeSlot: timeSlot,
      },
    });

    // Check unavailable dates
    const unavailableDates = await prisma.unavailableDate.findMany({
      where: {
        serviceId: tourId,
        serviceType: "tour",
        OR: [
          {
            startDate: { lte: tourDateTime },
            endDate: { gte: tourDateTime },
          },
        ],
      },
    });

    const isAvailable = conflictingBookings.length === 0 && unavailableDates.length === 0;

    if (!isAvailable) {
      return json({ 
        error: "Tour is not available for the selected date and time",
        conflictingBookings,
        unavailableDates,
      }, { status: 400 });
    }

    return json({
      success: true,
      isAvailable: true,
    });
  }

  if (intent === "createBooking") {
    const tourDate = formData.get("tourDate") as string;
    const timeSlot = formData.get("timeSlot") as string;
    const participants = parseInt(formData.get("participants") as string);
    const adults = parseInt(formData.get("adults") as string);
    const children = parseInt(formData.get("children") as string) || 0;
    const leadTravelerName = formData.get("leadTravelerName") as string;
    const leadTravelerEmail = formData.get("leadTravelerEmail") as string;
    const leadTravelerPhone = formData.get("leadTravelerPhone") as string;
    const participantNames = formData.getAll("participantNames") as string[];
    const participantAges = formData.getAll("participantAges") as string[];
    const dietaryRequirements = formData.getAll("dietaryRequirements") as string[];
    const accessibilityNeeds = formData.getAll("accessibilityNeeds") as string[];
    const meetingPoint = formData.get("meetingPoint") as string;
    const meetingTime = formData.get("meetingTime") as string;
    const specialRequests = formData.get("specialRequests") as string;
    const language = formData.get("language") as string;

    if (!tourDate || !timeSlot || !participants || !leadTravelerName || !leadTravelerEmail || !leadTravelerPhone) {
      return json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const tourDateTime = new Date(tourDate);

    // Get tour details for pricing
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: {
        pricePerPerson: true,
        currency: true,
        guideId: true,
      },
    });

    if (!tour) {
      return json({ error: "Tour not found" }, { status: 404 });
    }

    // Calculate pricing
    const pricePerPerson = tour.pricePerPerson;
    const childDiscount = children * (tour.pricePerPerson * 0.5); // 50% discount for children
    const groupDiscount = participants >= 5 ? (tour.pricePerPerson * participants * 0.1) : 0; // 10% group discount for 5+ people
    const totalPrice = (tour.pricePerPerson * participants) - childDiscount - groupDiscount;

    // Generate booking number
    const bookingNumber = `TB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    try {
      const booking = await prisma.tourBooking.create({
        data: {
          bookingNumber,
          tourDate: tourDateTime,
          timeSlot,
          participants,
          adults,
          children,
          pricePerPerson,
          childDiscount,
          groupDiscount,
          extraFees: 0,
          totalPrice,
          currency: tour.currency,
          status: "PENDING",
          paymentStatus: "PENDING",
          leadTravelerName,
          leadTravelerEmail,
          leadTravelerPhone,
          participantNames,
          participantAges: participantAges.map(age => parseInt(age)),
          dietaryRequirements,
          accessibilityNeeds,
          meetingPoint,
          meetingTime,
          specialRequests,
          language: language || "en",
          userId,
          tourId,
          guideId: tour.guideId,
        },
        include: {
          tour: {
            select: {
              title: true,
              type: true,
              duration: true,
              meetingPoint: true,
            },
          },
          guide: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      return json({
        success: true,
        booking,
        redirectUrl: `/book/payment/${booking.id}?type=tour`,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      return json({ error: "Failed to create booking. Please try again." }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function TourBooking() {
  const { tour, isAvailable, pricingBreakdown, totalPrice, searchParams } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();

  const [selectedDate, setSelectedDate] = useState(searchParams.tourDate || "");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(searchParams.timeSlot || "");
  const [participants, setParticipants] = useState(searchParams.participants || 1);
  const [adults, setAdults] = useState(searchParams.participants || 1);
  const [children, setChildren] = useState(0);
  const [leadTravelerDetails, setLeadTravelerDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [participantDetails, setParticipantDetails] = useState<Array<{name: string, age: number}>>([]);
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>([]);
  const [meetingDetails, setMeetingDetails] = useState({
    meetingPoint: tour.meetingPoint,
    meetingTime: "",
  });
  const [specialRequests, setSpecialRequests] = useState("");
  const [language, setLanguage] = useState("en");

  const isSubmitting = navigation.state === "submitting";

  const handleParticipantChange = (field: string, value: number) => {
    if (field === "participants") {
      setParticipants(value);
      setAdults(Math.max(1, value - children));
    } else if (field === "adults") {
      setAdults(value);
      setParticipants(value + children);
    } else if (field === "children") {
      setChildren(value);
    }
  };

  const handleParticipantDetailsChange = (index: number, field: string, value: string | number) => {
    const newDetails = [...participantDetails];
    if (!newDetails[index]) {
      newDetails[index] = { name: "", age: 18 };
    }
    newDetails[index] = { ...newDetails[index], [field]: value };
    setParticipantDetails(newDetails);
  };

  const handleRequirementChange = (type: string, requirement: string, checked: boolean) => {
    if (type === "dietary") {
      if (checked) {
        setDietaryRequirements(prev => [...prev, requirement]);
      } else {
        setDietaryRequirements(prev => prev.filter(item => item !== requirement));
      }
    } else if (type === "accessibility") {
      if (checked) {
        setAccessibilityNeeds(prev => [...prev, requirement]);
      } else {
        setAccessibilityNeeds(prev => prev.filter(item => item !== requirement));
      }
    }
  };

  const updateUrl = () => {
    const newSearchParams = new URLSearchParams(searchParamsUrl);
    if (selectedDate) newSearchParams.set("tourDate", selectedDate);
    if (selectedTimeSlot) newSearchParams.set("timeSlot", selectedTimeSlot);
    newSearchParams.set("participants", participants.toString());
    setSearchParamsUrl(newSearchParams);
  };

  useEffect(() => {
    updateUrl();
  }, [selectedDate, selectedTimeSlot, participants]);

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Halal",
    "Kosher",
    "No Nuts",
    "No Dairy",
    "Other",
  ];

  const accessibilityOptions = [
    "Wheelchair Access",
    "Mobility Assistance",
    "Visual Impairment Support",
    "Hearing Impairment Support",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tour Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">{tour.title}</CardTitle>
                    <div className="text-lg text-gray-600">
                      {tour.type} • {tour.duration} hours
                    </div>
                    <div className="flex items-center mt-2 text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{tour.meetingPoint}, {tour.city}, {tour.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{tour.rating.toFixed(1)}</span>
                      <span className="ml-1 text-gray-500">({tour.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">Max {tour.maxGroupSize} people</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{tour.duration} hours</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">Difficulty: {tour.difficulty}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{tour.languages.join(", ")}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">What's Included</h3>
                  <div className="flex flex-wrap gap-2">
                    {tour.inclusions.map((inclusion, index) => (
                      <Badge key={index} variant="secondary">
                        {inclusion}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{tour.description}</p>
                </div>

                {/* Guide Information */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Your Guide</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">{tour.guide.user.name}</div>
                      <div className="text-sm text-gray-600">
                        {tour.guide.yearsOfExperience} years experience
                      </div>
                      <div className="text-sm text-gray-600">
                        Languages: {tour.guide.languages.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Reviews */}
                {tour.reviews.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Recent Reviews</h3>
                    <div className="space-y-4">
                      {tour.reviews.map((review) => (
                        <div key={review.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 font-medium">{review.reviewerName}</span>
                            <span className="ml-2 text-gray-500 text-sm">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Book This Tour</CardTitle>
                <div className="text-2xl font-bold text-green-600">
                  {tour.currency} {tour.pricePerPerson.toFixed(2)} / person
                </div>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <Label htmlFor="tourDate">Tour Date</Label>
                    <Input
                      id="tourDate"
                      name="tourDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  {/* Time Slot Selection */}
                  <div>
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <select
                      id="timeSlot"
                      name="timeSlot"
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select a time slot</option>
                      {tour.timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Participant Count */}
                  <div>
                    <Label>Number of Participants</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="adults" className="text-sm">Adults</Label>
                        <Input
                          id="adults"
                          name="adults"
                          type="number"
                          min="1"
                          max={tour.maxGroupSize}
                          value={adults}
                          onChange={(e) => handleParticipantChange("adults", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="children" className="text-sm">Children</Label>
                        <Input
                          id="children"
                          name="children"
                          type="number"
                          min="0"
                          value={children}
                          onChange={(e) => handleParticipantChange("children", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lead Traveler Details */}
                  <div>
                    <Label htmlFor="leadTravelerName">Lead Traveler Name</Label>
                    <Input
                      id="leadTravelerName"
                      name="leadTravelerName"
                      type="text"
                      value={leadTravelerDetails.name}
                      onChange={(e) => setLeadTravelerDetails(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="leadTravelerEmail">Email</Label>
                    <Input
                      id="leadTravelerEmail"
                      name="leadTravelerEmail"
                      type="email"
                      value={leadTravelerDetails.email}
                      onChange={(e) => setLeadTravelerDetails(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="leadTravelerPhone">Phone</Label>
                    <Input
                      id="leadTravelerPhone"
                      name="leadTravelerPhone"
                      type="tel"
                      value={leadTravelerDetails.phone}
                      onChange={(e) => setLeadTravelerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Participant Details */}
                  {participants > 1 && (
                    <div>
                      <Label>Participant Details</Label>
                      <div className="space-y-4 mt-2">
                        {Array.from({ length: participants - 1 }).map((_, index) => (
                          <div key={index} className="border p-3 rounded-md">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`participantName${index}`} className="text-sm">Name</Label>
                                <Input
                                  id={`participantName${index}`}
                                  name="participantNames"
                                  type="text"
                                  value={participantDetails[index]?.name || ""}
                                  onChange={(e) => handleParticipantDetailsChange(index, "name", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`participantAge${index}`} className="text-sm">Age</Label>
                                <Input
                                  id={`participantAge${index}`}
                                  name="participantAges"
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={participantDetails[index]?.age || 18}
                                  onChange={(e) => handleParticipantDetailsChange(index, "age", parseInt(e.target.value) || 18)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dietary Requirements */}
                  <div>
                    <Label>Dietary Requirements</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {dietaryOptions.map((requirement) => (
                        <div key={requirement} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dietary-${requirement}`}
                            name="dietaryRequirements"
                            value={requirement}
                            checked={dietaryRequirements.includes(requirement)}
                            onCheckedChange={(checked) => handleRequirementChange("dietary", requirement, checked as boolean)}
                          />
                          <Label htmlFor={`dietary-${requirement}`} className="text-sm">
                            {requirement}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility Needs */}
                  <div>
                    <Label>Accessibility Needs</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {accessibilityOptions.map((need) => (
                        <div key={need} className="flex items-center space-x-2">
                          <Checkbox
                            id={`accessibility-${need}`}
                            name="accessibilityNeeds"
                            value={need}
                            checked={accessibilityNeeds.includes(need)}
                            onCheckedChange={(checked) => handleRequirementChange("accessibility", need, checked as boolean)}
                          />
                          <Label htmlFor={`accessibility-${need}`} className="text-sm">
                            {need}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meeting Details */}
                  <div>
                    <Label htmlFor="meetingPoint">Meeting Point</Label>
                    <Input
                      id="meetingPoint"
                      name="meetingPoint"
                      type="text"
                      value={meetingDetails.meetingPoint}
                      onChange={(e) => setMeetingDetails(prev => ({ ...prev, meetingPoint: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="meetingTime">Meeting Time</Label>
                    <Input
                      id="meetingTime"
                      name="meetingTime"
                      type="time"
                      value={meetingDetails.meetingTime}
                      onChange={(e) => setMeetingDetails(prev => ({ ...prev, meetingTime: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Language Selection */}
                  <div>
                    <Label htmlFor="language">Preferred Language</Label>
                    <select
                      id="language"
                      name="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {tour.languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requests or requirements..."
                    />
                  </div>

                  {/* Pricing Breakdown */}
                  {selectedDate && selectedTimeSlot && participants > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Price Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>{tour.currency} {tour.pricePerPerson.toFixed(2)} × {participants} people</span>
                          <span>{tour.currency} {(tour.pricePerPerson * participants).toFixed(2)}</span>
                        </div>
                        {children > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Child discount (50%)</span>
                            <span>-{tour.currency} {(children * tour.pricePerPerson * 0.5).toFixed(2)}</span>
                          </div>
                        )}
                        {participants >= 5 && (
                          <div className="flex justify-between text-green-600">
                            <span>Group discount (10%)</span>
                            <span>-{tour.currency} {(tour.pricePerPerson * participants * 0.1).toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{tour.currency} {totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Messages */}
                  {actionData?.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{actionData.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    name="intent"
                    value="createBooking"
                    className="w-full"
                    disabled={isSubmitting || !selectedDate || !selectedTimeSlot}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Book Now"
                    )}
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}