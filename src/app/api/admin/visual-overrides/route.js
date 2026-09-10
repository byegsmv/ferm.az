import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * Universal Visual Editor — override saxlama API-si.
 * Hər hansı səhifədəki mətn/düymə/link/şəkil redaktələri burada saxlanılır.
 *
 * GET  ?path=/az/products        — hərkəs üçün açıq (normal render üçün)
 *   → { overrides: { [key]: { kind, value, prev } } }
 *
 * POST { path, key, kind, value, prev, remove? }  — yalnız admin/moderator
 *   → { success: true, overrides }
 */

const BLOCK_WHERE = { page: "system", type: "visual_overrides" };

async function getBlock() {
  return prisma.dynamicBlock.findFirst({ where: BLOCK_WHERE });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = (searchParams.get("path") || "/").slice(0, 300);
    const block = await getBlock();
    const all = (block?.props && block.props.overrides) || {};
    return Response.json({ success: true, path, overrides: all[path] || {} });
  } catch (e) {
    console.error("visual-overrides GET:", e.message);
    return Response.json({ success: false, overrides: {} }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role)) {
    return Response.json({ error: "Yalnız admin redaktə edə bilər" }, { status: 403 });
  }
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Yanlış JSON" }, { status: 400 }); }

  const { path, key, kind, value, prev, remove } = body;
  if (!path || !key || !kind) return Response.json({ error: "path, key, kind tələb olunur" }, { status: 422 });
  if (!["text", "href", "src", "bg", "styleText"].includes(kind)) return Response.json({ error: "Naməlum kind" }, { status: 422 });

  try {
    let block = await getBlock();
    const overrides = { ...((block?.props?.overrides) || {}) };
    const pageOv = { ...(overrides[path] || {}) };
    if (remove) delete pageOv[key];
    else pageOv[key] = { kind, value: String(value ?? "").slice(0, 20000), prev: String(prev ?? "").slice(0, 2000) };
    overrides[path] = pageOv;

    if (block) {
      block = await prisma.dynamicBlock.update({ where: { id: block.id }, data: { props: { ...block.props, overrides } } });
    } else {
      block = await prisma.dynamicBlock.create({ data: { page: "system", type: "visual_overrides", props: { overrides } } });
    }
    return Response.json({ success: true, overrides: overrides[path] });
  } catch (e) {
    console.error("visual-overrides POST:", e.message);
    return Response.json({ error: "Saxlanılmadı: " + e.message }, { status: 500 });
  }
}

// Bütün səhifənin override-larını sıfırla
export async function DELETE(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
    return Response.json({ error: "Yalnız admin" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const path = (searchParams.get("path") || "").slice(0, 300);
  if (!path) return Response.json({ error: "path tələb olunur" }, { status: 422 });
  try {
    const block = await getBlock();
    if (block) {
      const overrides = { ...((block?.props?.overrides) || {}) };
      delete overrides[path];
      await prisma.dynamicBlock.update({ where: { id: block.id }, data: { props: { ...block.props, overrides } } });
    }
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
