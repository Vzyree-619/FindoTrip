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
      bookingId, // Add bookingId to loader data
    });
  } catch (error) {
    console.error("Error loading booking confirmation:", error);
    throw new Response("Failed to load booking confirmation", { status: 500 });
  }
}

export default function BookingConfirmation() {
  const { booking, service, provider, payment, bookingType, bookingId } = useLoaderData<typeof loader>();
  const isPendingPayment = !payment || payment.status === 'PENDING';

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

  const handleDownloadVoucher = () => {
    // Generate detailed voucher HTML
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
          ${booking.confirmationCode ? `
          <div class="detail-row">
            <span class="detail-label">Confirmation Code:</span>
            <span class="detail-value">${booking.confirmationCode}</span>
          </div>
          ` : ''}
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
            <span class="detail-label">Check-in:</span>
            <span class="detail-value">${new Date(serviceDetails.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check-out:</span>
            <span class="detail-value">${new Date(serviceDetails.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Guests:</span>
            <span class="detail-value">${serviceDetails.guests} ${serviceDetails.guests === "1" ? "person" : "people"}</span>
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
          ${booking.specialRequests ? `
          <div class="detail-row">
            <span class="detail-label">Special Requests:</span>
            <span class="detail-value">${booking.specialRequests}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Pricing Details</div>
          <div class="detail-row">
            <span class="detail-label">Base Price:</span>
            <span class="detail-value">${booking.currency} ${booking.basePrice?.toFixed(2) || '0.00'}</span>
          </div>
          ${booking.cleaningFee ? `
          <div class="detail-row">
            <span class="detail-label">Cleaning Fee:</span>
            <span class="detail-value">${booking.currency} ${booking.cleaningFee.toFixed(2)}</span>
          </div>
          ` : ''}
          ${booking.serviceFee ? `
          <div class="detail-row">
            <span class="detail-label">Service Fee:</span>
            <span class="detail-value">${booking.currency} ${booking.serviceFee.toFixed(2)}</span>
          </div>
          ` : ''}
          ${booking.taxes ? `
          <div class="detail-row">
            <span class="detail-label">Taxes:</span>
            <span class="detail-value">${booking.currency} ${booking.taxes.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="detail-row" style="border-top: 2px solid #01502E; margin-top: 10px; padding-top: 10px;">
            <span class="detail-label" style="font-size: 18px;">Total Amount:</span>
            <span class="detail-value" style="font-size: 18px; font-weight: bold; color: #01502E;">${booking.currency} ${booking.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        ${provider ? `
        <div class="section">
          <div class="section-title">Provider Contact</div>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${provider.user?.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${provider.user?.email || 'N/A'}</span>
          </div>
          ${provider.user?.phone ? `
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${provider.user.phone}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>This is your official booking voucher. Please present this at check-in.</p>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>For support, contact: support@findotrip.com</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
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
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Booking details copied to clipboard!');
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert('Booking details copied to clipboard!');
    }
  };

  const handleContactSupport = () => {
    window.location.href = `/dashboard/support?booking=${bookingId}&type=${bookingType}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{isPendingPayment ? 'Booking Created' : 'Booking Confirmed!'}</h1>
          <p className="text-gray-600">
            {isPendingPayment
              ? "Your booking was created and is pending provider approval/payment verification. You'll be notified once confirmed."
              : "Your booking has been successfully confirmed. You'll receive a confirmation email shortly."}
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
                    <Link to={`/accommodations/${booking.propertyId}?contact=true`}>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {payment && payment.status === 'COMPLETED' && (
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
            {isPendingPayment && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="text-sm">Pending</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Next Step</span>
                      <span className="text-sm">Await provider approval/verification</span>
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
                    <Button className="w-full" variant="outline" onClick={handleDownloadVoucher}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Voucher
                    </Button>
                    <Button className="w-full" variant="outline" onClick={handleShareBooking}>
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
                    <Button variant="outline" className="w-full" onClick={handleContactSupport}>
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
