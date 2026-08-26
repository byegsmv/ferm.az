import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/builder?page=home
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "home";

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: `builder_page_${page}` },
    });

    if (!setting) {
      return Response.json({ success: true, data: null });
    }

    return Response.json({ success: true, data: JSON.parse(setting.value) });
  } catch (error) {
    console.error("Builder GET Error:", error);
    return Response.json({ error: "Xəta baş verdi" }, { status: 500 });
  }
}

// POST /api/admin/builder
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { page, sections, pageSettings } = body;

    if (!page || !sections) {
      return Response.json({ error: "Eksik məlumat" }, { status: 400 });
    }

    const payload = JSON.stringify({ pageSettings, sections });

    await prisma.setting.upsert({
      where: { key: `builder_page_${page}` },
      update: { value: payload, updatedAt: new Date() },
      create: {
        key: `builder_page_${page}`,
        value: payload,
        category: "builder",
      },
    });

    return Response.json({ success: true, message: "Səhifə uğurla yadda saxlanıldı!" });
  } catch (error) {
    console.error("Builder POST Error:", error);
    return Response.json({ error: "Yadda saxlanarkən xəta baş verdi" }, { status: 500 });
  }
}
