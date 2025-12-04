import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { DollarSign, TrendingUp, CreditCard, Wallet, AlertCircle, CheckCircle, Calendar, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get property owner
  const owner = await prisma.propertyOwner.findUnique({
    where: { userId },
    include: {
      user: {
        select: { name: true, email: true }
      },
      properties: {
        select: { id: true, name: true }
      }
    }
  });

  if (!owner) {
    throw redirect("/dashboard/provider");
  }

  // Get all bookings for this owner's properties
  const propertyIds = owner.properties.map(p => p.id);
  
  const bookings = await prisma.propertyBooking.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: { in: ["CONFIRMED", "COMPLETED"] }
    },
    include: {
      property: {
        select: { name: true }
      },
      roomType: {
        select: { name: true }
      },
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Get payments for these bookings
  const bookingIds = bookings.map(b => b.id);
  const payments = await prisma.payment.findMany({
    where: {
      bookingId: { in: bookingIds },
      bookingType: "property"
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Get commissions
  const commissions = await prisma.commission.findMany({
    where: {
      propertyOwnerId: owner.id,
      bookingType: "property"
    },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: {
      calculatedAt: "desc"
    }
  });

  // Calculate revenue statistics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Total revenue
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  
  // Revenue by payment method
  const revenueByMethod = {
    online: 0,
    payAtProperty: 0
  };

  bookings.forEach(booking => {
    const payment = payments.find(p => p.bookingId === booking.id);
    if (payment) {
      if (payment.method === "CASH") {
        revenueByMethod.payAtProperty += booking.totalPrice;
      } else {
        revenueByMethod.online += booking.totalPrice;
      }
    } else {
      // If no payment record, assume it's pending (pay at property)
      revenueByMethod.payAtProperty += booking.totalPrice;
    }
  });

  // Monthly revenue
  const monthlyRevenue = bookings
    .filter(b => new Date(b.createdAt) >= startOfMonth)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Last month revenue
  const lastMonthRevenue = bookings
    .filter(b => {
      const date = new Date(b.createdAt);
      return date >= lastMonth && date <= endOfLastMonth;
    })
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Yearly revenue
  const yearlyRevenue = bookings
    .filter(b => new Date(b.createdAt) >= startOfYear)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Commission statistics
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions
    .filter(c => c.status === "PENDING")
    .reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions
    .filter(c => c.status === "PAID")
    .reduce((sum, c) => sum + c.amount, 0);

  // Pending commissions for pay-at-property bookings
  const payAtPropertyCommissions = commissions.filter(c => {
    const booking = bookings.find(b => b.id === c.bookingId);
    if (!booking) return false;
    const payment = payments.find(p => p.bookingId === booking.id);
    return !payment || payment.method === "CASH";
  });

  // Recent bookings (last 10)
  const recentBookings = bookings.slice(0, 10);

  return json({
    owner,
    totalRevenue,
    revenueByMethod,
    monthlyRevenue,
    lastMonthRevenue,
    yearlyRevenue,
    totalCommissions,
    pendingCommissions,
    paidCommissions,
    commissions: commissions.slice(0, 50), // Last 50 commissions
    payAtPropertyCommissions: payAtPropertyCommissions.filter(c => c.status === "PENDING"),
    recentBookings,
    bookingsCount: bookings.length
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const owner = await prisma.propertyOwner.findUnique({
    where: { userId }
  });

  if (!owner) {
    return json({ error: "Property owner not found" }, { status: 404 });
  }

  if (intent === "pay-commission") {
    const commissionId = formData.get("commissionId") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const transactionId = formData.get("transactionId") as string;

    if (!commissionId || !paymentMethod || !transactionId) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify commission belongs to this owner
    const commission = await prisma.commission.findFirst({
      where: {
        id: commissionId,
        propertyOwnerId: owner.id,
        status: "PENDING"
      }
    });

    if (!commission) {
      return json({ error: "Commission not found or already paid" }, { status: 404 });
    }

    // Update commission status
    await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        payout: {
          create: {
            userId: owner.userId,
            propertyOwnerId: owner.id,
            amount: commission.amount,
            currency: commission.currency,
            status: "COMPLETED",
            paymentMethod: paymentMethod as any,
            transactionId: transactionId,
            processedAt: new Date()
          }
        }
      }
    });

    return json({ success: true, message: "Commission paid successfully" });
  }

  if (intent === "pay-all-pending") {
    const paymentMethod = formData.get("paymentMethod") as string;
    const transactionId = formData.get("transactionId") as string;

    if (!paymentMethod || !transactionId) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get all pending commissions for pay-at-property bookings
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        propertyOwnerId: owner.id,
        status: "PENDING",
        bookingType: "property"
      }
    });

    if (pendingCommissions.length === 0) {
      return json({ error: "No pending commissions to pay" }, { status: 400 });
    }

    const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

    // Create a single payout for all commissions
    const payout = await prisma.payout.create({
      data: {
        userId: owner.userId,
        propertyOwnerId: owner.id,
        amount: totalAmount,
        currency: "PKR",
        status: "COMPLETED",
        paymentMethod: paymentMethod as any,
        transactionId: transactionId,
        processedAt: new Date()
      }
    });

    // Update all commissions
    await prisma.commission.updateMany({
      where: {
        id: { in: pendingCommissions.map(c => c.id) },
        propertyOwnerId: owner.id,
        status: "PENDING"
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
        payoutId: payout.id
      }
    });

    return json({ 
      success: true, 
      message: `Successfully paid ${pendingCommissions.length} commission(s) totaling ${totalAmount.toLocaleString()} PKR` 
    });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function RevenueDashboard() {
  const {
    owner,
    totalRevenue,
    revenueByMethod,
    monthlyRevenue,
    lastMonthRevenue,
    yearlyRevenue,
    totalCommissions,
    pendingCommissions,
    paidCommissions,
    commissions,
    payAtPropertyCommissions,
    recentBookings,
    bookingsCount
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard/provider"
            className="text-[#01502E] hover:text-[#013d23] mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Revenue Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
                Track your earnings and manage commission payments
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {actionData.message}
            </p>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {actionData.error}
            </p>
          </div>
        )}

        {/* Revenue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  PKR {totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#01502E] dark:text-[#4ade80]" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  PKR {monthlyRevenue.toLocaleString()}
                </p>
                {lastMonthRevenue > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Commissions</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  PKR {pendingCommissions.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {payAtPropertyCommissions.length} from pay-at-property
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {bookingsCount}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue by Payment Method
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Online Payments</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    PKR {revenueByMethod.online.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${totalRevenue > 0 ? (revenueByMethod.online / totalRevenue) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pay at Property</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    PKR {revenueByMethod.payAtProperty.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${totalRevenue > 0 ? (revenueByMethod.payAtProperty / totalRevenue) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Commission Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Commissions</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  PKR {totalCommissions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  PKR {paidCommissions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  PKR {pendingCommissions.toLocaleString()}
                </span>
              </div>
              {pendingCommissions > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Pay-at-property bookings require manual commission payment
                  </p>
                  <Form method="post" className="flex gap-2">
                    <input type="hidden" name="intent" value="pay-all-pending" />
                    <Select name="paymentMethod" required>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="STRIPE">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      name="transactionId"
                      placeholder="Transaction ID"
                      required
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-[#01502E] hover:bg-[#013d23] text-white">
                      Pay All Pending
                    </Button>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Commissions for Pay-at-Property */}
        {payAtPropertyCommissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Commissions (Pay at Property)
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {payAtPropertyCommissions.length} commission(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Booking ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Calculated
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payAtPropertyCommissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {commission.bookingId.slice(-8)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                        PKR {commission.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(commission.calculatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Form method="post" className="flex gap-2">
                          <input type="hidden" name="intent" value="pay-commission" />
                          <input type="hidden" name="commissionId" value={commission.id} />
                          <Select name="paymentMethod" required>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BANK_TRANSFER">Bank</SelectItem>
                              <SelectItem value="PAYPAL">PayPal</SelectItem>
                              <SelectItem value="STRIPE">Stripe</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            name="transactionId"
                            placeholder="TXN ID"
                            required
                            className="w-32"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-[#01502E] hover:bg-[#013d23] text-white"
                          >
                            Pay
                          </Button>
                        </Form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Bookings
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Booking #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Property
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Guest
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {booking.bookingNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {booking.property.name}
                      {booking.roomType && ` - ${booking.roomType.name}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {booking.user.name}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      PKR {booking.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : booking.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

