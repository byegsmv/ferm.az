import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

/**
 * Qlobal Xüsusi CSS — admin tərəfindən yazılan CSS bütün sayta tətbiq olunur
 * (layout.js <style> kakinə qoyur). Visual Studio → "Qlobal CSS" paneli.
 */

const WHERE = { page: "system", type: "custom_css" };

async function getCss() {
  try {
    const b = await prisma.dynamicBlock.findFirst({ where: WHERE });
    return (b?.props?.css) || "";
  } catch {
    return "";
  }
}

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;
  return Response.json({ success: true, css: await getCss() });
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const css = String(body?.css || "").slice(0, 100000);

  try {
    const b = await prisma.dynamicBlock.findFirst({ where: WHERE });
    if (b) {
      await prisma.dynamicBlock.update({ where: { id: b.id }, data: { props: { ...b.props, css } } });
    } else {
      await prisma.dynamicBlock.create({ data: { page: "system", type: "custom_css", props: { css } } });
    }
    return Response.json({ success: true, css });
  } catch (e) {
    console.error("custom-css POST:", e?.message);
    return Response.json({ error: "CSS yadda saxlanılmadı" }, { status: 500 });
  }
}
