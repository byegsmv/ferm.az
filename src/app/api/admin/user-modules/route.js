import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/user-modules — iki mod:
// 1. ?userId=xxx — spesifik istifadəçinin modulları (existing format)
// 2. Boş — bütün modullar (ModuleToggleSystem üçün)
export async function GET(request) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (userId) {
    // Existing format: specific user's modules
    const modules = await prisma.userModule.findMany({
      where: { userId },
      select: { id: true, module: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ modules });
  }

  // ModuleToggleSystem format: return all modules as array
  const allModules = await prisma.userModule.findMany({
    select: { id: true, module: true, userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  
  // Return as array directly for ModuleToggleSystem compatibility
  return Response.json(allModules);
}

// POST /api/admin/user-modules — iki mod:
// 1. {userId, module} — tək modul əlavə/sil (existing)
// 2. {modules: [{module, enabled}, ...]} — bulk update (ModuleToggleSystem)
export async function POST(request) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Bulk update mode (ModuleToggleSystem)
  if (body.modules && Array.isArray(body.modules)) {
    for (const mod of body.modules) {
      if (mod.enabled) {
        await prisma.userModule.upsert({
          where: { userId_module: { userId: authUser.sub, module: mod.module } },
          create: { userId: authUser.sub, module: mod.module, grantedBy: authUser.sub },
          update: { grantedBy: authUser.sub },
        });
      } else {
        await prisma.userModule.deleteMany({
          where: { userId: authUser.sub, module: mod.module },
        }).catch(() => {});
      }
    }
    return Response.json({ success: true });
  }

  // Single module mode (existing)
  const { userId, module } = body;
  if (!userId || !module) {
    return Response.json({ error: "userId və module tələb olunur" }, { status: 400 });
  }

  const VALID_MODULES = ["WALLET","BLOG","BUNDLES","CORPORATE_LISTINGS","AI_AGRONOM","ANALYTICS","CAMPAIGNS","BULK_CSV","DELIVERY","LEADERBOARD","CATEGORIES_SLIDER","HERO_SECTION","PROMO_BANNER","PRODUCTS_GRID","BLOG_SECTION","TESTIMONIALS","NEWSLETTER_SIGNUP","WEATHER_WIDGET","AGRONOMIST_AI","COMPARISON_TOOL","FAVORITES","DIRECT_MESSAGING","WALLET_SYSTEM","STORE_RATINGS"];
  if (!VALID_MODULES.includes(module)) {
    return Response.json({ error: "Yanlış modul adı" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true } });
  if (!user) return Response.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  const created = await prisma.userModule.upsert({
    where: { userId_module: { userId, module } },
    create: { userId, module, grantedBy: authUser.sub },
    update: { grantedBy: authUser.sub },
  });

  return Response.json({ success: true, userModule: created });
}

// DELETE /api/admin/user-modules — modul sil
export async function DELETE(request) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { userId, module } = body;
  if (!userId || !module) {
    return Response.json({ error: "userId və module tələb olunur" }, { status: 400 });
  }

  await prisma.userModule.deleteMany({ where: { userId, module } });
  return Response.json({ success: true });
}
