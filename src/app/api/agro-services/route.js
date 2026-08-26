import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/agro-services — list of service requests (admin sees all, user sees own)
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "soil_analysis" | "leaf_analysis" | "consultation"

  const where = { userId: user.id };
  if (type) where.serviceType = type;

  // Admin sees all
  if (["ADMIN", "SUPER_ADMIN", "AGRONOMIST"].includes(user.role)) {
    delete where.userId;
    if (type) where.serviceType = type;
  }

  const services = await prisma.agroServiceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { fullName: true, email: true, phone: true } } },
  });

  return Response.json({ services });
}

// POST /api/agro-services — create a new service request
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Giriş tələb olunur" }, { status: 401 });

  try {
    const body = await request.json();
    const { serviceType, farmLocation, cropType, area, notes, contactPhone } = body;

    if (!serviceType) return Response.json({ error: "Xidmət növü tələb olunur" }, { status: 400 });

    const service = await prisma.agroServiceRequest.create({
      data: {
        userId: user.id,
        serviceType,
        farmLocation: farmLocation || null,
        cropType: cropType || null,
        area: area || null,
        notes: notes || null,
        contactPhone: contactPhone || user.phone || null,
        status: "PENDING",
      },
    });

    return Response.json({ service }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
