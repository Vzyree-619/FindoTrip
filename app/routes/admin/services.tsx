import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireAdmin } from "~/lib/auth/middleware";
import { Check, X, Eye, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get all pending services
  const [pendingProperties, pendingVehicles, pendingTours] = await Promise.all([
    prisma.property.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        owner: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.vehicle.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        owner: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.tour.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        guide: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return json({
    pendingProperties,
    pendingVehicles,
    pendingTours
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const adminUser = await requireAdmin(request);
  const formData = await request.formData();

  const action = formData.get("action") as string;
  const type = formData.get("type") as string;
  const id = formData.get("id") as string;
  const rejectionReason = formData.get("rejectionReason") as string;

  try {
    if (action === "approve") {
      if (type === "property") {
        await prisma.property.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            approvedBy: adminUser.id,
            approvedAt: new Date(),
            available: true,
          }
        });

        // Get property details for notification
        const property = await prisma.property.findUnique({
          where: { id },
          include: {
            owner: {
              include: { user: { select: { id: true, email: true, name: true } } }
            }
          }
        });

        if (property) {
          // Create notification for property owner
          await prisma.notification.create({
            data: {
              userId: property.owner.user.id,
              userRole: "PROPERTY_OWNER",
              type: "LISTING_APPROVED",
              title: "Property Approved",
              message: `Your property "${property.name}" has been approved and is now live!`,
              data: { propertyId: property.id }
            }
          });

          // TODO: Send approval email
        }

      } else if (type === "vehicle") {
        await prisma.vehicle.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            approvedBy: adminUser.id,
            approvedAt: new Date(),
            available: true,
          }
        });

        // Get vehicle details for notification
        const vehicle = await prisma.vehicle.findUnique({
          where: { id },
          include: {
            owner: {
              include: { user: { select: { id: true, email: true, name: true } } }
            }
          }
        });

        if (vehicle) {
          // Create notification for vehicle owner
          await prisma.notification.create({
            data: {
              userId: vehicle.owner.user.id,
              userRole: "VEHICLE_OWNER",
              type: "LISTING_APPROVED",
              title: "Vehicle Approved",
              message: `Your vehicle "${vehicle.name}" has been approved and is now available for booking!`,
              data: { vehicleId: vehicle.id }
            }
          });

          // TODO: Send approval email
        }

      } else if (type === "tour") {
        await prisma.tour.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            approvedBy: adminUser.id,
            approvedAt: new Date(),
            available: true,
          }
        });

        // Get tour details for notification
        const tour = await prisma.tour.findUnique({
          where: { id },
          include: {
            guide: {
              include: { user: { select: { id: true, email: true, name: true } } }
            }
          }
        });

        if (tour) {
          // Create notification for tour guide
          await prisma.notification.create({
            data: {
              userId: tour.guide.user.id,
              userRole: "TOUR_GUIDE",
              type: "LISTING_APPROVED",
              title: "Tour Approved",
              message: `Your tour "${tour.title}" has been approved and is now live!`,
              data: { tourId: tour.id }
            }
          });

          // TODO: Send approval email
        }
      }

      // TODO: Add audit log
      // await prisma.auditLog.create({
      //   data: {
      //     adminId: adminUser.id,
      //     action: "APPROVE",
      //     entityType: type,
      //     entityId: id,
      //     details: `${type} approved`
      //   }
      // });

    } else if (action === "reject") {
      if (!rejectionReason?.trim()) {
        return json({ error: "Rejection reason is required" }, { status: 400 });
      }

      if (type === "property") {
        await prisma.property.update({
          where: { id },
          data: {
            approvalStatus: "REJECTED",
            approvedBy: adminUser.id,
            rejectionReason
          }
        });

        // Get property details for notification
        const property = await prisma.property.findUnique({
          where: { id },
          include: {
            owner: {
              include: { user: { select: { id: true, email: true, name: true } } }
            }
          }
        });

        if (property) {
          // Create notification for property owner
          await prisma.notification.create({
            data: {
              userId: property.owner.user.id,
              userRole: "PROPERTY_OWNER",
              type: "LISTING_REJECTED",
              title: "Property Rejected",
              message: `Your property "${property.name}" was rejected: ${rejectionReason}`,
              data: { propertyId: property.id, reason: rejectionReason }
            }
          });

          // TODO: Send rejection email
        }

      } else if (type === "vehicle") {
        await prisma.vehicle.update({
          where: { id },
          data: {
            approvalStatus: "REJECTED",
            approvedBy: adminUser.id,
            rejectionReason
          }
        });

        // Get vehicle details for notification
        const vehicle = await prisma.vehicle.findUnique({
          where: { id },
          include: {
            owner: {
              include: { user: { select: { id: true, email: true, name: true } } }
            }
          }
        });

        if (vehicle) {
          // Create notification for vehicle owner
          await prisma.notification.create({
            data: {
              userId: vehicle.owner.user.id,
              userRole: "VEHICLE_OWNER",
              type: "LISTING_REJECTED",
              title: "Vehicle Rejected",
              message: `Your vehicle "${vehicle.name}" was rejected: ${rejectionReason}`,
              data: { vehicleId: vehicle.id, reason: rejectionReason }
            }
          });

          // TODO: Send rejection email
        }

      } else if (type === "tour") {
        await prisma.tour.update({
          where: { id },
          data: {
            approvalStatus: "REJECTED",
            approvedBy: adminUser.id,
            rejectionReason
          }
        });

        // Get tour details for notification
        const tour = await prisma.tour.findUnique({
          where: { id },
          include: {
            guide: {
              include: { user: { select: { id: true, email: true, name: true } } }
            }
          }
        });

        if (tour) {
          // Create notification for tour guide
          await prisma.notification.create({
            data: {
              userId: tour.guide.user.id,
              userRole: "TOUR_GUIDE",
              type: "LISTING_REJECTED",
              title: "Tour Rejected",
              message: `Your tour "${tour.title}" was rejected: ${rejectionReason}`,
              data: { tourId: tour.id, reason: rejectionReason }
            }
          });

          // TODO: Send rejection email
        }
      }

      // TODO: Add audit log
      // await prisma.auditLog.create({
      //   data: {
      //     adminId: adminUser.id,
      //     action: "REJECT",
      //     entityType: type,
      //     entityId: id,
      //     details: `${type} rejected: ${rejectionReason}`
      //   }
      // });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Service approval action error:", error);
    return json({ error: "Failed to process approval" }, { status: 500 });
  }
}

export default function AdminServices() {
  const { pendingProperties, pendingVehicles, pendingTours } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const ServiceCard = ({ item, type }: { item: any; type: string }) => {
    const title = type === 'property' ? item.name :
                  type === 'vehicle' ? item.name :
                  item.title;
    const owner = type === 'tour' ? item.guide.user : item.owner.user;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">by {owner.name} ({owner.email})</p>
            <p className="text-xs text-gray-500 mt-1">
              Submitted {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">Pending Review</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {type === 'property' ? item.basePrice :
               type === 'vehicle' ? item.basePrice :
               item.pricePerPerson}
            </p>
            <p className="text-sm text-gray-600">Price (PKR)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {type === 'property' ? item.maxGuests :
               type === 'vehicle' ? item.seats :
               item.maxGroupSize}
            </p>
            <p className="text-sm text-gray-600">
              {type === 'property' ? 'Max Guests' :
               type === 'vehicle' ? 'Seats' :
               'Max Group'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{item.city}</p>
            <p className="text-sm text-gray-600">Location</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Form method="post" className="flex-1">
            <input type="hidden" name="action" value="approve" />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
          </Form>

          <button
            onClick={() => {
              const reason = prompt("Rejection reason:");
              if (reason) {
                const form = document.createElement('form');
                form.method = 'post';
                form.innerHTML = `
                  <input type="hidden" name="action" value="reject" />
                  <input type="hidden" name="type" value="${type}" />
                  <input type="hidden" name="id" value="${item.id}" />
                  <input type="hidden" name="rejectionReason" value="${reason}" />
                `;
                document.body.appendChild(form);
                form.submit();
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Approvals</h1>
          <p className="mt-2 text-gray-600">Review and approve provider services</p>
        </div>

        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Action completed successfully
                </p>
              </div>
            </div>
          </div>
        )}

        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {actionData.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Properties */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Property Listings</h2>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              {pendingProperties.length} pending
            </span>
          </div>
          {pendingProperties.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No pending property approvals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingProperties.map((property) => (
                <ServiceCard key={property.id} item={property} type="property" />
              ))}
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Vehicle Listings</h2>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              {pendingVehicles.length} pending
            </span>
          </div>
          {pendingVehicles.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No pending vehicle approvals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingVehicles.map((vehicle) => (
                <ServiceCard key={vehicle.id} item={vehicle} type="vehicle" />
              ))}
            </div>
          )}
        </div>

        {/* Tours */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tour Listings</h2>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              {pendingTours.length} pending
            </span>
          </div>
          {pendingTours.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No pending tour approvals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingTours.map((tour) => (
                <ServiceCard key={tour.id} item={tour} type="tour" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
