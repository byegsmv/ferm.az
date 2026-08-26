import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/sales-points?region=...&storeId=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const storeId = searchParams.get("storeId");

  try {
    const where = {
      isActive: true,
      ...(region ? { region: { contains: region, mode: "insensitive" } } : {}),
      ...(storeId ? { storeId } : {})
    };

    const salesPoints = await prisma.salesPoint.findMany({
      where,
      include: {
        store: { select: { name: true, slug: true, logoUrl: true } }
      }
    });

    return Response.json({ salesPoints });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// POST /api/sales-points
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return Response.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { storeId, region, city, address, lat, lng, phone, workHours } = body;
  if (!storeId || !region || !address) {
    return Response.json({ error: "storeId, region və address tələb olunur" }, { status: 422 });
  }

  try {
    // Verify owner of the store or admin
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return Response.json({ error: "Mağaza tapılmadı" }, { status: 404 });
    }

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
    if (store.ownerId !== authUser.sub && !isAdmin) {
      return Response.json({ error: "Bu mağaza üçün satış nöqtəsi əlavə etmək icazəniz yoxdur" }, { status: 403 });
    }

    const salesPoint = await prisma.salesPoint.create({
      data: {
        storeId,
        region,
        city,
        address,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        phone,
        workHours,
        isActive: true
      }
    });

    return Response.json({ salesPoint }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
