import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useFetcher } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Eye, 
  MessageSquare,
  User,
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const reason = url.searchParams.get("reason");
  const search = url.searchParams.get("search");

  // Build filters
  const where: any = {};
  if (status) where.status = status;
  if (reason) where.reason = reason;
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { reporter: { name: { contains: search, mode: "insensitive" } } },
      { reportedUser: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Get abuse reports
  const abuseReports = await prisma.abuseReport.findMany({
    where,
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      reportedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      message: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: {
            select: {
              name: true,
            },
          },
        },
      },
      conversation: {
        select: {
          id: true,
          title: true,
          ticketNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Get flagged users
  const flaggedUsers = await prisma.userFlag.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  // Get user violations
  const userViolations = await prisma.userViolation.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return json({
    abuseReports,
    flaggedUsers,
    userViolations,
    filters: { status, reason, search },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateReportStatus") {
    const reportId = formData.get("reportId") as string;
    const status = formData.get("status") as string;
    const adminNotes = formData.get("adminNotes") as string;

    await prisma.abuseReport.update({
      where: { id: reportId },
      data: {
        status: status as any,
        adminNotes,
        updatedAt: new Date(),
      },
    });

    return json({ success: true, message: "Report status updated" });
  }

  if (intent === "deleteMessage") {
    const messageId = formData.get("messageId") as string;
    const reason = formData.get("reason") as string;

    await prisma.supportMessage.update({
      where: { id: messageId },
      data: {
        content: "[MESSAGE DELETED BY ADMIN]",
        type: "SYSTEM",
        systemData: {
          action: "message_deleted",
          reason,
          deletedBy: userId,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return json({ success: true, message: "Message deleted" });
  }

  if (intent === "warnUser") {
    const targetUserId = formData.get("targetUserId") as string;
    const warningMessage = formData.get("warningMessage") as string;

    // Create warning message
    await prisma.supportMessage.create({
      data: {
        content: `⚠️ **ADMIN WARNING**\n\n${warningMessage}`,
        type: "SYSTEM",
        ticketId: "system", // This would need to be handled differently
        senderId: userId,
        systemData: {
          action: "admin_warning",
          targetUserId,
          warningMessage,
        },
      },
    });

    return json({ success: true, message: "Warning sent to user" });
  }

  if (intent === "suspendUser") {
    const targetUserId = formData.get("targetUserId") as string;
    const reason = formData.get("reason") as string;
    const duration = parseInt(formData.get("duration") as string);

    const suspendedUntil = new Date(Date.now() + duration * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        suspendedUntil,
        suspensionReason: reason,
      },
    });

    await prisma.userViolation.create({
      data: {
        userId: targetUserId,
        violationType: "suspension",
        reason,
        adminId: userId,
        duration,
        status: "active",
      },
    });

    return json({ success: true, message: "User suspended" });
  }

  if (intent === "banUser") {
    const targetUserId = formData.get("targetUserId") as string;
    const reason = formData.get("reason") as string;

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        banned: true,
        banReason: reason,
        bannedAt: new Date(),
      },
    });

    await prisma.userViolation.create({
      data: {
        userId: targetUserId,
        violationType: "ban",
        reason,
        adminId: userId,
        status: "active",
      },
    });

    return json({ success: true, message: "User banned" });
  }

  if (intent === "dismissFlag") {
    const flagId = formData.get("flagId") as string;
    const reason = formData.get("reason") as string;

    await prisma.userFlag.update({
      where: { id: flagId },
      data: {
        dismissed: true,
        dismissReason: reason,
        dismissedBy: userId,
        dismissedAt: new Date(),
      },
    });

    return json({ success: true, message: "Flag dismissed" });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminModeration() {
  const { abuseReports, flaggedUsers, userViolations, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [showBanForm, setShowBanForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "reviewed": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "dismissed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "spam": return "bg-red-100 text-red-800";
      case "harassment": return "bg-orange-100 text-orange-800";
      case "inappropriate": return "bg-purple-100 text-purple-800";
      case "scam": return "bg-yellow-100 text-yellow-800";
      case "other": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Moderation Center</h1>
          <p className="text-gray-600 mt-2">Manage abuse reports and user violations</p>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Abuse Reports */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Flag className="h-5 w-5 mr-2" />
                    Abuse Reports
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search reports..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <input type="hidden" name="statusFilter" id="statusFilter-value" defaultValue="" />
                    <Select defaultValue="" onValueChange={(value) => {
                      const hiddenInput = document.getElementById('statusFilter-value') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = value;
                    }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {abuseReports.map((report) => (
                    <div
                      key={report.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedReport?.id === report.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            <Badge className={getReasonColor(report.reason)}>
                              {report.reason}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span>Reported by: {report.reporter.name}</span>
                            <span>•</span>
                            <span>Target: {report.reportedUser.name}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>

                          <p className="text-sm text-gray-700 mb-2">{report.description}</p>

                          {report.message && (
                            <div className="bg-gray-50 p-3 rounded text-sm">
                              <p className="font-medium">Reported Message:</p>
                              <p className="text-gray-600">{report.message.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                From: {report.message.sender.name} • {new Date(report.message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          <div>#{report.id.slice(-8)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Details */}
          <div className="lg:col-span-1">
            {selectedReport ? (
              <ReportDetails 
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
                  <p className="text-gray-600">
                    Choose an abuse report to view details and take action
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Flagged Users */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Flagged Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flaggedUsers.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{flag.user.name}</h3>
                      <Badge className={getSeverityColor(flag.severity)}>
                        {flag.severity}
                      </Badge>
                      <Badge variant="outline">
                        {flag.flagType}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{flag.reason}</p>
                    <p className="text-xs text-gray-500">
                      Flagged: {new Date(flag.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(flag.user)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Form method="post" className="inline">
                      <input type="hidden" name="intent" value="dismissFlag" />
                      <input type="hidden" name="flagId" value={flag.id} />
                      <input type="hidden" name="reason" value="Dismissed by admin" />
                      <Button variant="outline" size="sm" type="submit">
                        <XCircle className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Violations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ban className="h-5 w-5 mr-2" />
              User Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userViolations.map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{violation.user.name}</h3>
                      <Badge className="bg-red-100 text-red-800">
                        {violation.violationType}
                      </Badge>
                      <Badge className={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{violation.reason}</p>
                    <p className="text-xs text-gray-500">
                      By: {violation.admin.name} • {new Date(violation.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Status: {violation.status}</div>
                    {violation.duration && (
                      <div>Duration: {violation.duration}h</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Report Details Component
function ReportDetails({ report, onClose }: { report: any; onClose: () => void }) {
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [showBanForm, setShowBanForm] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Report Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Report Info */}
        <div>
          <h4 className="font-medium mb-2">Report Information</h4>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm"><strong>Status:</strong> {report.status}</p>
            <p className="text-sm"><strong>Reason:</strong> {report.reason}</p>
            <p className="text-sm"><strong>Description:</strong> {report.description}</p>
            <p className="text-sm"><strong>Reported:</strong> {new Date(report.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Users Involved */}
        <div>
          <h4 className="font-medium mb-2">Users Involved</h4>
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm font-medium">Reporter: {report.reporter.name}</p>
              <p className="text-xs text-gray-600">{report.reporter.email}</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="text-sm font-medium">Reported User: {report.reportedUser.name}</p>
              <p className="text-xs text-gray-600">{report.reportedUser.email}</p>
            </div>
          </div>
        </div>

        {/* Message Content */}
        {report.message && (
          <div>
            <h4 className="font-medium mb-2">Reported Message</h4>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm">{report.message.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                From: {report.message.sender.name} • {new Date(report.message.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h4 className="font-medium mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <Form method="post" className="inline-block w-full">
              <input type="hidden" name="intent" value="updateReportStatus" />
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="status" id="status-value" defaultValue="pending" />
              <Select defaultValue="pending" onValueChange={(value) => {
                const hiddenInput = document.getElementById('status-value') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = value;
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                name="adminNotes"
                className="w-full mt-2"
                rows={3}
                placeholder="Admin notes..."
              />
              <Button type="submit" className="w-full mt-2">
                Update Status
              </Button>
            </Form>

            {report.message && (
              <Form method="post" className="inline-block w-full">
                <input type="hidden" name="intent" value="deleteMessage" />
                <input type="hidden" name="messageId" value={report.message.id} />
                <input type="hidden" name="reason" value="Deleted due to abuse report" />
                <Button type="submit" variant="outline" className="w-full text-red-600 border-red-300">
                  Delete Message
                </Button>
              </Form>
            )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSuspendForm(!showSuspendForm)}
                className="flex-1"
              >
                Suspend User
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBanForm(!showBanForm)}
                className="flex-1 text-red-600 border-red-300"
              >
                Ban User
              </Button>
            </div>
          </div>
        </div>

        {/* Suspend Form */}
        {showSuspendForm && (
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="suspendUser" />
            <input type="hidden" name="targetUserId" value={report.reportedUserId} />
            
            <div>
              <Label className="mb-2">Duration (hours)</Label>
              <input type="hidden" name="duration" id="duration-value" defaultValue="24" />
              <Select defaultValue="24" onValueChange={(value) => {
                const hiddenInput = document.getElementById('duration-value') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = value;
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                  <SelectItem value="720">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Reason</Label>
              <Textarea
                name="reason"
                className="w-full"
                rows={3}
                placeholder="Reason for suspension..."
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Suspend User
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSuspendForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}

        {/* Ban Form */}
        {showBanForm && (
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="banUser" />
            <input type="hidden" name="targetUserId" value={report.reportedUserId} />
            
            <div>
              <Label className="mb-2">Reason</Label>
              <Textarea
                name="reason"
                className="w-full"
                rows={3}
                placeholder="Reason for ban..."
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                Ban User
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBanForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
