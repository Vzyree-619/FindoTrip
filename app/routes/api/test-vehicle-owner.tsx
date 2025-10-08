import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { getUserId } from "~/lib/auth/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userId = await getUserId(request);
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    // Test database connection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Test creating a minimal vehicle owner profile
    const testData = {
      userId,
      businessName: "Test Fleet Business",
      businessType: "individual",
      insuranceProvider: "Test Insurance",
      insurancePolicy: "TEST-POLICY-123",
      insuranceExpiry: new Date(),
      businessPhone: "+1234567890",
      businessEmail: "test@example.com",
      businessAddress: "123 Test Street",
      businessCity: "Test City",
      businessState: "Test State",
      businessCountry: "Test Country",
      drivingLicense: "TEST-LICENSE-123",
      licenseExpiry: new Date(),
      drivingExperience: 5,
      languages: ["English"],
      vehicleTypes: ["CAR"],
      serviceAreas: ["Test City"]
    };

    // Check if vehicle owner already exists
    const existingOwner = await prisma.vehicleOwner.findUnique({
      where: { userId }
    });

    if (existingOwner) {
      return json({ 
        success: true, 
        message: "Vehicle owner profile already exists",
        data: existingOwner
      });
    }

    // Try to create vehicle owner
    const vehicleOwner = await prisma.vehicleOwner.create({
      data: testData
    });

    return json({ 
      success: true, 
      message: "Test vehicle owner profile created successfully",
      data: vehicleOwner
    });

  } catch (error) {
    console.error("Test vehicle owner creation error:", error);
    
    return json({ 
      success: false,
      error: "Failed to create test vehicle owner profile",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
