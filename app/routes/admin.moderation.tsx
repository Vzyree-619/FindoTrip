import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Shield, CheckCircle, X, Eye, AlertTriangle, Clock, Star, MapPin, Car, Users } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);

  // Get pending content for moderation
  const [pendingProperties, pendingVehicles, pendingTours] = await Promise.all([
    prisma.property.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        owner: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.vehicle.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        owner: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.tour.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        guide: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return json({
    user,
    pendingProperties,
    pendingVehicles,
    pendingTours
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const itemId = formData.get("itemId");
  const itemType = formData.get("itemType");
  const action = formData.get("action");

  if (!itemId || !itemType || !action) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    let updateData: any = {};
    
    if (action === "approve") {
      updateData = { approvalStatus: "APPROVED" };
    } else if (action === "reject") {
      updateData = { approvalStatus: "REJECTED" };
    }

    if (itemType === "property") {
      await prisma.property.update({
        where: { id: itemId as string },
        data: updateData
      });
    } else if (itemType === "vehicle") {
      await prisma.vehicle.update({
        where: { id: itemId as string },
        data: updateData
      });
    } else if (itemType === "tour") {
      await prisma.tour.update({
        where: { id: itemId as string },
        data: updateData
      });
    }

    return json({ success: true, message: `Item ${action}d successfully` });
  } catch (error) {
    console.error("Moderation action error:", error);
    return json({ error: "Failed to process action" }, { status: 500 });
  }
}

export default function AdminModeration() {
  const { user, pendingProperties, pendingVehicles, pendingTours } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "property": return <MapPin className="h-4 w-4" />;
      case "vehicle": return <Car className="h-4 w-4" />;
      case "tour": return <Users className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-gray-600">Review and approve content submitted by users.</p>
        </div>

        {/* Action Messages */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {actionData.message}
          </div>
        )}

        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {actionData.error}
          </div>
        )}

        {/* Pending Properties */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#01502E]" />
              Pending Properties ({pendingProperties.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingProperties.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending properties</p>
            ) : (
              <div className="space-y-4">
                {pendingProperties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{property.name}</h3>
                        <p className="text-gray-600">{property.address}, {property.city}</p>
                        <p className="text-sm text-gray-500">
                          Owner: {property.owner.user.name} ({property.owner.user.email})
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(property.approvalStatus)}>
                            {property.approvalStatus}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {property.basePrice} {property.currency} per night
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="moderate" />
                          <input type="hidden" name="itemId" value={property.id} />
                          <input type="hidden" name="itemType" value="property" />
                          <input type="hidden" name="action" value="approve" />
                          <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="moderate" />
                          <input type="hidden" name="itemId" value={property.id} />
                          <input type="hidden" name="itemType" value="property" />
                          <input type="hidden" name="action" value="reject" />
                          <Button type="submit" size="sm" variant="destructive">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </Form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Vehicles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-[#01502E]" />
              Pending Vehicles ({pendingVehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingVehicles.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending vehicles</p>
            ) : (
              <div className="space-y-4">
                {pendingVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                        <p className="text-gray-600">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                        <p className="text-sm text-gray-500">
                          Owner: {vehicle.owner.user.name} ({vehicle.owner.user.email})
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(vehicle.approvalStatus)}>
                            {vehicle.approvalStatus}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {vehicle.basePrice} {vehicle.currency} per day
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="moderate" />
                          <input type="hidden" name="itemId" value={vehicle.id} />
                          <input type="hidden" name="itemType" value="vehicle" />
                          <input type="hidden" name="action" value="approve" />
                          <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="moderate" />
                          <input type="hidden" name="itemId" value={vehicle.id} />
                          <input type="hidden" name="itemType" value="vehicle" />
                          <input type="hidden" name="action" value="reject" />
                          <Button type="submit" size="sm" variant="destructive">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </Form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tours */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#01502E]" />
              Pending Tours ({pendingTours.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTours.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending tours</p>
            ) : (
              <div className="space-y-4">
                {pendingTours.map((tour) => (
                  <div key={tour.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{tour.name}</h3>
                        <p className="text-gray-600">{tour.description}</p>
                        <p className="text-sm text-gray-500">
                          Guide: {tour.guide.user.name} ({tour.guide.user.email})
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(tour.approvalStatus)}>
                            {tour.approvalStatus}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {tour.pricePerPerson} {tour.currency} per person
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="moderate" />
                          <input type="hidden" name="itemId" value={tour.id} />
                          <input type="hidden" name="itemType" value="tour" />
                          <input type="hidden" name="action" value="approve" />
                          <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="moderate" />
                          <input type="hidden" name="itemId" value={tour.id} />
                          <input type="hidden" name="itemType" value="tour" />
                          <input type="hidden" name="action" value="reject" />
                          <Button type="submit" size="sm" variant="destructive">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </Form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}