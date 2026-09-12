import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { DEFAULT_STORE_PACKAGES } from "@/lib/storePackages";

async function getPackages() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "store_packages_config" },
    });
    if (setting?.value) {
      const saved = JSON.parse(setting.value);
      if (Array.isArray(saved) && saved.length) {
        return saved;
      }
    }
  } catch (error) {
    console.error("GET store-packages config error:", error);
  }
  return DEFAULT_STORE_PACKAGES;
}

// GET /api/config/store-packages — public: mağaza paketləri və qiymətləri
export async function GET() {
  const packages = await getPackages();
  return Response.json({ success: true, packages });
}

// PATCH /api/config/store-packages — Admin / Super Admin: qiymətləri yenilə
// body: { packages: [ { key, price, ... } ] } — hazırkı strukturu qoruyaraq birləşdirir
export async function PATCH(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const incoming = body?.packages;
    if (!Array.isArray(incoming) || !incoming.length) {
      return Response.json({ error: "packages massivi tələb olunur" }, { status: 400 });
    }

    const current = await getPackages();
    const merged = current.map((cur) => {
      const upd = incoming.find((p) => p && p.key === cur.key);
      if (!upd) return cur;
      return {
        ...cur,
        ...upd,
        key: cur.key, // açar dəyişdirilə bilməz
        price: Number.isFinite(Number(upd.price)) ? Number(upd.price) : cur.price,
      };
    });

    await prisma.setting.upsert({
      where: { key: "store_packages_config" },
      update: { value: JSON.stringify(merged), updatedAt: new Date() },
      create: { key: "store_packages_config", value: JSON.stringify(merged), category: "pricing" },
    });

    return Response.json({ success: true, packages: merged });
  } catch (error) {
    console.error("PATCH /api/config/store-packages error:", error);
    return Response.json({ error: "Qiymətlər yadda saxlanılmadı" }, { status: 500 });
  }
}
