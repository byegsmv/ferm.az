import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import slugify from "slugify";

export async function GET() {
  try {
    const ingredients = await prisma.activeIngredient.findMany({
      orderBy: { nameAz: 'asc' }
    });
    return NextResponse.json(ingredients);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const authUser = await getAuthUser(req);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, name, nameAz, description } = body;

    const baseSlug = slugify(nameAz || name, { lower: true, strict: true });

    if (id) {
      const updated = await prisma.activeIngredient.update({
        where: { id },
        data: { name, nameAz, description }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.activeIngredient.create({
        data: { name, nameAz, slug: `${baseSlug}-${Date.now().toString(36)}`, description }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const authUser = await getAuthUser(req);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.activeIngredient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
