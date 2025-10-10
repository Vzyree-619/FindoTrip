import { json } from "@remix-run/node";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

export async function action({ request }) {
  const user = await getUser(request);
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const type = formData.get("type");
  const id = formData.get("id");
  const status = formData.get("status");

  if (!type || !id || !status) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    let result;
    
    switch (type) {
      case 'property':
        result = await prisma.property.update({
          where: { id },
          data: { approvalStatus: status }
        });
        break;
      case 'vehicle':
        result = await prisma.vehicle.update({
          where: { id },
          data: { approvalStatus: status }
        });
        break;
      case 'tour':
        result = await prisma.tour.update({
          where: { id },
          data: { approvalStatus: status }
        });
        break;
      default:
        return json({ error: "Invalid type" }, { status: 400 });
    }

    return json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating status:', error);
    return json({ error: "Failed to update status" }, { status: 500 });
  }
}
