import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");

    const translations = await prisma.translation.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { entityType: "asc" },
      take: 100,
    });
    return NextResponse.json(translations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { entityType, entityId, field, locale, value } = body;

    const translation = await prisma.translation.upsert({
      where: {
        entityType_entityId_field_locale: {
          entityType,
          entityId,
          field,
          locale,
        },
      },
      update: { value },
      create: { entityType, entityId, field, locale, value },
    });

    return NextResponse.json(translation);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.translation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
