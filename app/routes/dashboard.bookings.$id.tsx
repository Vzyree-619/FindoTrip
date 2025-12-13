import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Car, 
  Star, 
  Download, 
  Share2, 
  MessageCircle,
  ArrowLeft,
  Building,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const bookingId = params.id;
  
  if (!bookingId) {
    throw new Response("Booking ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const bookingType = url.searchParams.get("type") || "property";

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
          roomType: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      });

      if (booking) {
        service = booking.property;
        provider = booking.property.owner;
      }
    } else if (bookingType === "vehicle") {
      booking = await prisma.vehicleBooking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            include: {
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
        },
      });

      if (booking) {
        service = booking.vehicle;
        provider = booking.vehicle.owner;
      }
    } else if (bookingType === "tour") {
      booking = await prisma.tourBooking.findUnique({
        where: { id: bookingId },
        include: {
          tour: {
            include: {
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
        },
      });

      if (booking) {
        service = booking.tour;
        provider = booking.tour.guide;
      }
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
        bookingType: bookingType.toUpperCase(),
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
      bookingId,
    });
  } catch (error) {
    console.error("Error loading booking details:", error);
    throw new Response("Failed to load booking details", { status: 500 });
  }
}

export default function BookingDetails() {
  const { booking, service, provider, payment, bookingType, bookingId } = useLoaderData<typeof loader>();
  const isPendingPayment = !payment || payment.status === 'PENDING';

  const getServiceIcon = () => {
    if (bookingType === "property") return Building;
    if (bookingType === "vehicle") return Car;
    if (bookingType === "tour") return MapPin;
    return Calendar;
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
  const ServiceIcon = getServiceIcon();

  const handleDownloadVoucher = () => {
    const voucherHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Booking Voucher - ${booking.bookingNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #01502E; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #01502E; margin-bottom: 10px; }
          .booking-number { font-size: 18px; color: #666; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: bold; color: #01502E; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .status-pending { background: #fff3cd; color: #856404; }
          .status-confirmed { background: #d4edda; color: #155724; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">FindoTrip</div>
          <div class="booking-number">Booking Voucher #${booking.bookingNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Booking Information</div>
          <div class="detail-row">
            <span class="detail-label">Booking Number:</span>
            <span class="detail-value">${booking.bookingNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
              <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Status:</span>
            <span class="detail-value">${booking.paymentStatus}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Service Details</div>
          ${serviceDetails ? `
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${serviceDetails.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${serviceDetails.location}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Dates:</span>
            <span class="detail-value">${serviceDetails.dates}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Guests:</span>
            <span class="detail-value">${serviceDetails.guests}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Guest Information</div>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${booking.guestName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${booking.guestEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${booking.guestPhone}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Pricing Details</div>
          <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value" style="font-size: 18px; font-weight: bold; color: #01502E;">${booking.currency} ${booking.totalPrice?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div class="footer">
          <p>This is your official booking voucher. Please present this at check-in.</p>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([voucherHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-voucher-${booking.bookingNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareBooking = () => {
    const shareText = `I've booked ${serviceDetails?.name || 'a service'} on FindoTrip!\n\nBooking Number: ${booking.bookingNumber}\nDates: ${serviceDetails?.dates || 'N/A'}\n\nCheck it out!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: `My Booking - ${booking.bookingNumber}`,
        text: shareText,
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Booking details copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert('Booking details copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard/bookings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600 mt-1">Booking #{booking.bookingNumber}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadVoucher}>
                <Download className="h-4 w-4 mr-2" />
                Download Voucher
              </Button>
              <Button variant="outline" onClick={handleShareBooking}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ServiceIcon className="h-5 w-5 mr-2" />
                    Booking Status
                  </span>
                  <Badge 
                    variant={booking.status === "CONFIRMED" ? "default" : booking.status === "PENDING" ? "secondary" : "destructive"}
                    className={booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" : booking.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : ""}
                  >
                    {booking.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <Badge variant={booking.paymentStatus === "COMPLETED" ? "default" : "secondary"}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                  {isPendingPayment && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Payment Pending</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            {booking.paymentStatus === "PENDING" && bookingType === "property"
                              ? "You will pay at the property upon check-in."
                              : "Please complete payment to confirm your booking."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
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
                        <p className="text-xs text-gray-500 mt-1">
                          Check-in: {new Date(serviceDetails.checkIn).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Check-out: {new Date(serviceDetails.checkOut).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Guests</span>
                        </div>
                        <p className="text-sm">{serviceDetails.guests} {serviceDetails.guests === "1" ? "person" : "people"}</p>
                        {bookingType === "property" && "adults" in booking && (
                          <p className="text-xs text-gray-500 mt-1">
                            {booking.adults} adults, {booking.children || 0} children
                          </p>
                        )}
                      </div>
                    </div>

                    {bookingType === "property" && "roomType" in booking && booking.roomType && (
                      <>
                        <Separator />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Room Type:</span>
                          <p className="text-sm mt-1">{booking.roomType.name}</p>
                          {booking.roomType.description && (
                            <p className="text-xs text-gray-500 mt-1">{booking.roomType.description}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookingType === "property" && "basePrice" in booking && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Price</span>
                        <span className="text-sm">{booking.currency} {booking.basePrice?.toFixed(2) || '0.00'}</span>
                      </div>
                      {booking.cleaningFee && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cleaning Fee</span>
                          <span className="text-sm">{booking.currency} {booking.cleaningFee.toFixed(2)}</span>
                        </div>
                      )}
                      {booking.serviceFee && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Service Fee</span>
                          <span className="text-sm">{booking.currency} {booking.serviceFee.toFixed(2)}</span>
                        </div>
                      )}
                      {booking.taxes && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Taxes</span>
                          <span className="text-sm">{booking.currency} {booking.taxes.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount</span>
                    <span className="text-[#01502E]">{booking.currency} {booking.totalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-medium">{booking.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm">{booking.guestEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone</span>
                    <span className="text-sm">{booking.guestPhone}</span>
                  </div>
                  {booking.specialRequests && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-sm font-medium text-gray-600">Special Requests</span>
                        <p className="text-sm mt-1">{booking.specialRequests}</p>
                      </div>
                    </>
                  )}
                </div>
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
                      {provider.user?.phone && (
                        <p className="text-sm text-gray-600">{provider.user.phone}</p>
                      )}
                    </div>
                    {bookingType === "property" && "property" in booking && (
                      <Link to={`/accommodations/${booking.propertyId}?contact=true`}>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link to={`/book/confirmation/${bookingId}?type=${bookingType}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      View Confirmation
                    </Button>
                  </Link>
                  <Link to="/dashboard/bookings">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      All My Bookings
                    </Button>
                  </Link>
                  <Link to="/dashboard/support">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {payment && payment.status === 'COMPLETED' && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Method</span>
                      <span className="text-sm font-medium">{payment.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount Paid</span>
                      <span className="text-sm font-medium">{payment.currency} {payment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transaction ID</span>
                      <span className="text-sm font-mono text-xs">{payment.transactionId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Paid On</span>
                      <span className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

