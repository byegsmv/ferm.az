import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/farmer-profile
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return Response.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  try {
    let profile = await prisma.farmerProfile.findUnique({
      where: { userId: authUser.sub }
    });

    if (!profile) {
      // Create a default empty profile
      profile = await prisma.farmerProfile.create({
        data: {
          userId: authUser.sub,
          region: "",
          village: "",
          totalArea: 0,
          crops: [],
          greenhouse: 0,
          garden: 0,
          irrigationType: "",
          soilAnalysis: {},
          previousProducts: []
        }
      });
    }

    return Response.json({ profile });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}

// PATCH /api/farmer-profile
export async function PATCH(request) {
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

  try {
    const profile = await prisma.farmerProfile.upsert({
      where: { userId: authUser.sub },
      update: {
        region: body.region !== undefined ? body.region : undefined,
        village: body.village !== undefined ? body.village : undefined,
        totalArea: body.totalArea !== undefined ? (body.totalArea ? Number(body.totalArea) : null) : undefined,
        crops: body.crops !== undefined ? body.crops : undefined,
        greenhouse: body.greenhouse !== undefined ? (body.greenhouse ? Number(body.greenhouse) : null) : undefined,
        garden: body.garden !== undefined ? (body.garden ? Number(body.garden) : null) : undefined,
        irrigationType: body.irrigationType !== undefined ? body.irrigationType : undefined,
        soilAnalysis: body.soilAnalysis !== undefined ? body.soilAnalysis : undefined,
        previousProducts: body.previousProducts !== undefined ? body.previousProducts : undefined
      },
      create: {
        userId: authUser.sub,
        region: body.region || "",
        village: body.village || "",
        totalArea: body.totalArea ? Number(body.totalArea) : 0,
        crops: body.crops || [],
        greenhouse: body.greenhouse ? Number(body.greenhouse) : 0,
        garden: body.garden ? Number(body.garden) : 0,
        irrigationType: body.irrigationType || "",
        soilAnalysis: body.soilAnalysis || {},
        previousProducts: body.previousProducts || []
      }
    });

    return Response.json({ profile });
  } catch (error) {
    return Response.json({ error: error.message || "Xəta baş verdi" }, { status: 500 });
  }
}
