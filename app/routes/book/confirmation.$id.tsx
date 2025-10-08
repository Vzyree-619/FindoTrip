import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { CheckCircle, Calendar, MapPin, Users, Car, Star, Download, Share2, MessageCircle } from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const bookingId = params.id;
  
  if (!bookingId) {
    throw new Response("Booking ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const bookingType = url.searchParams.get("type");

  if (!bookingType || !["property", "vehicle", "tour"].includes(bookingType)) {
    throw new Response("Invalid booking type", { status: 400 });
  }

  let booking;
  let service;
  let provider;

  try {
    if (bookingType === "property") {
      booking = await prisma.propertyBooking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: {
              name: true,
              address: true,
              city: true,
              country: true,
              images: true,
              owner: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      service = booking?.property;
      provider = booking?.property?.owner;
    } else if (bookingType === "vehicle") {
      booking = await prisma.vehicleBooking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            select: {
              name: true,
              brand: true,
              model: true,
              year: true,
              type: true,
              images: true,
              owner: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      service = booking?.vehicle;
      provider = booking?.vehicle?.owner;
    } else if (bookingType === "tour") {
      booking = await prisma.tourBooking.findUnique({
        where: { id: bookingId },
        include: {
          tour: {
            select: {
              title: true,
              type: true,
              duration: true,
              meetingPoint: true,
              city: true,
              country: true,
              images: true,
              guide: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      service = booking?.tour;
      provider = booking?.tour?.guide;
    }

    if (!booking) {
      throw new Response("Booking not found", { status: 404 });
    }

    // Check if booking belongs to the current user
    if (booking.userId !== userId) {
      throw new Response("Unauthorized", { status: 403 });
    }

    // Get payment details
    const payment = await prisma.payment.findFirst({
      where: {
        bookingId,
        bookingType,
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return json({
      booking,
      service,
      provider,
      payment,
      bookingType,
    });
  } catch (error) {
    console.error("Error loading booking confirmation:", error);
    throw new Response("Failed to load booking confirmation", { status: 500 });
  }
}

export default function BookingConfirmation() {
  const { booking, service, provider, payment, bookingType } = useLoaderData<typeof loader>();

  const getServiceIcon = () => {
    if (bookingType === "property") return "🏨";
    if (bookingType === "vehicle") return "🚗";
    if (bookingType === "tour") return "🎯";
    return "📋";
  };

  const getServiceDetails = () => {
    if (bookingType === "property" && "property" in booking) {
      return {
        name: service?.name || "Property",
        location: `${service?.city}, ${service?.country}`,
        dates: `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`,
        guests: booking.guests,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      };
    } else if (bookingType === "vehicle" && "vehicle" in booking) {
      return {
        name: `${service?.brand} ${service?.model} (${service?.year})`,
        location: booking.pickupLocation,
        dates: `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`,
        guests: "1",
        checkIn: booking.startDate,
        checkOut: booking.endDate,
      };
    } else if (bookingType === "tour" && "tour" in booking) {
      return {
        name: service?.title || "Tour",
        location: `${service?.meetingPoint}, ${service?.city}`,
        dates: `${new Date(booking.tourDate).toLocaleDateString()} at ${booking.timeSlot}`,
        guests: booking.participants,
        checkIn: booking.tourDate,
        checkOut: booking.tourDate,
      };
    }
    return null;
  };

  const serviceDetails = getServiceDetails();

  const generateQRCode = () => {
    // In a real app, you would generate a QR code with booking details
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">
          Booking: ${booking.bookingNumber}
        </text>
      </svg>
    `)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your {bookingType} booking has been successfully confirmed. You'll receive a confirmation email shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-2xl mr-3">{getServiceIcon()}</span>
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {serviceDetails && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{serviceDetails.name}</h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{serviceDetails.location}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Dates</span>
                        </div>
                        <p className="text-sm">{serviceDetails.dates}</p>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Guests</span>
                        </div>
                        <p className="text-sm">{serviceDetails.guests} {serviceDetails.guests === "1" ? "person" : "people"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Booking Number</span>
                        <span className="font-mono text-sm">{booking.bookingNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Status</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <span className="font-semibold">{booking.currency} {booking.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Information */}
            {provider && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {provider.user?.name?.charAt(0) || "P"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{provider.user?.name}</h3>
                      <p className="text-sm text-gray-600">{provider.user?.email}</p>
                      <p className="text-sm text-gray-600">{provider.user?.phone}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {payment && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transaction ID</span>
                      <span className="font-mono text-sm">{payment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Method</span>
                      <span className="text-sm">{payment.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount Paid</span>
                      <span className="font-semibold">{payment.currency} {payment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Date</span>
                      <span className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Confirmation Email</h4>
                      <p className="text-sm text-gray-600">
                        You'll receive a detailed confirmation email with all booking details.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Provider Notification</h4>
                      <p className="text-sm text-gray-600">
                        The service provider has been notified and will contact you if needed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Prepare for Your {bookingType === "property" ? "Stay" : bookingType === "vehicle" ? "Trip" : "Tour"}</h4>
                      <p className="text-sm text-gray-600">
                        Check your email for any special instructions or requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Voucher and Actions */}
          <div className="space-y-6">
            {/* Digital Voucher */}
            <Card>
              <CardHeader>
                <CardTitle>Digital Voucher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img
                      src={generateQRCode()}
                      alt="QR Code"
                      className="w-24 h-24"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Show this QR code to the service provider for verification.
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Voucher
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Booking
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link to={`/dashboard/bookings/${bookingId}?type=${bookingType}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Booking Details
                    </Button>
                  </Link>
                  <Link to="/dashboard/bookings">
                    <Button variant="outline" className="w-full justify-start">
                      <Star className="h-4 w-4 mr-2" />
                      All My Bookings
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    If you have any questions about your booking, our support team is here to help.
                  </p>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
