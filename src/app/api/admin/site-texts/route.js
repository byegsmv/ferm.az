import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// Bu açarlar Footer.js-də sərt kodlaşdırılıb — CMS vasitəsilə heç kim (admin daxil)
// dəyişə/silə/yenidən yarada bilməz.
const PROTECTED_KEYS = ["footer.copyright", "footer.developedBy"];

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");

  const where = {};
  if (group && group !== "all" && group !== "Hamısı") {
    where.group = group;
  }

  const siteTexts = await prisma.siteText.findMany({
    where,
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });

  // footer.copyright / footer.developedBy are hardcoded in Footer.js and
  // must never appear in the CMS editing UI.
  const visible = siteTexts.filter((t) => !PROTECTED_KEYS.includes(t.key));

  return Response.json({ siteTexts: visible });
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { key, group, label, valueAz, valueEn, valueRu } = body;

  if (!key || valueAz === undefined) {
    return Response.json({ error: "Açar (key) və Azərbaycan dili dəyəri (valueAz) tələb olunur" }, { status: 400 });
  }

  if (PROTECTED_KEYS.includes(key.trim())) {
    return Response.json({ error: "Bu açar qorunur və CMS-də yaradıla bilməz" }, { status: 403 });
  }

  const existing = await prisma.siteText.findUnique({ where: { key: key.trim() } });
  if (existing) {
    return Response.json({ error: "Bu açar (key) artıq mövcuddur" }, { status: 400 });
  }

  const siteText = await prisma.siteText.create({
    data: {
      key: key.trim(),
      group: group ? group.trim() : "general",
      label: label ? label.trim() : key.trim(),
      valueAz: valueAz || "",
      valueEn: valueEn || null,
      valueRu: valueRu || null,
    },
  });

  return Response.json({ success: true, siteText }, { status: 201 });
}

export async function PUT(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const items = Array.isArray(body.texts) ? body.texts : body.id || body.key ? [body] : [];

  if (items.length === 0) {
    return Response.json({ error: "Yeniləmək üçün məzmun tapılmadı" }, { status: 400 });
  }

  // Resolve ids to keys up front so protected rows can't be edited via id either
  const idsToCheck = items.filter((i) => i.id && !i.key).map((i) => i.id);
  let idKeyMap = {};
  if (idsToCheck.length > 0) {
    const rows = await prisma.siteText.findMany({ where: { id: { in: idsToCheck } }, select: { id: true, key: true } });
    idKeyMap = Object.fromEntries(rows.map((r) => [r.id, r.key]));
  }

  let updatedCount = 0;
  for (const item of items) {
    if (!item.id && !item.key) continue;
    const resolvedKey = item.key || idKeyMap[item.id];
    if (resolvedKey && PROTECTED_KEYS.includes(resolvedKey)) continue;

    const data = {};
    if (item.valueAz !== undefined) data.valueAz = item.valueAz;
    if (item.valueEn !== undefined) data.valueEn = item.valueEn;
    if (item.valueRu !== undefined) data.valueRu = item.valueRu;
    if (item.label !== undefined) data.label = item.label;
    if (item.group !== undefined) data.group = item.group;
    if (item.isActive !== undefined) data.isActive = item.isActive;

    if (item.id) {
      await prisma.siteText.update({
        where: { id: item.id },
        data,
      });
      updatedCount++;
    } else if (item.key) {
      await prisma.siteText.update({
        where: { key: item.key },
        data,
      });
      updatedCount++;
    }
  }

  return Response.json({ success: true, updatedCount });
}

export async function DELETE(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");
  let key = searchParams.get("key");

  if (!id && !key) {
    try {
      const body = await request.json();
      id = body.id;
      key = body.key;
    } catch {}
  }

  if (!id && !key) {
    return Response.json({ error: "id və ya key parametri tələb olunur" }, { status: 400 });
  }

  let targetKey = key;
  if (!targetKey && id) {
    const row = await prisma.siteText.findUnique({ where: { id }, select: { key: true } });
    targetKey = row?.key;
  }
  if (targetKey && PROTECTED_KEYS.includes(targetKey)) {
    return Response.json({ error: "Bu açar qorunur və silinə bilməz" }, { status: 403 });
  }

  if (id) {
    await prisma.siteText.delete({ where: { id } });
  } else if (key) {
    await prisma.siteText.delete({ where: { key } });
  }

  return Response.json({ success: true });
}
