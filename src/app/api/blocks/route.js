import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser, requireRole } from "@/lib/auth";

const prisma = new PrismaClient();

// GET blocks for a page
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || searchParams.get("pageName") || "home";

    const blocks = await prisma.dynamicBlock.findMany({
      where: { page },
      orderBy: { sortOrder: "asc" }
    });

    // Return in both formats for compatibility
    return NextResponse.json(blocks.length > 0 ? blocks : { components: [] });
  } catch (error) {
    return NextResponse.json({ components: [], error: error.message }, { status: 500 });
  }
}

// POST to save page layout
export async function POST(req) {
  const authUser = await getAuthUser(req);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json();

    // Handle both formats: {blocks, page} (existing) and {pageName, components} (PageBuilder)
    const page = body.page || body.pageName || "home";
    const items = body.blocks || body.components || [];

    // Transform components format to DynamicBlock format if needed
    const toCreate = items.map((b, i) => ({
      page,
      type: b.type || b.id || 'custom',
      props: typeof b.props === 'object' ? b.props : { value: b.props || b.content || '' },
      sortOrder: i,
      isActive: b.isActive ?? true
    }));

    await prisma.$transaction(async (tx) => {
      await tx.dynamicBlock.deleteMany({ where: { page } });
      if (toCreate.length > 0) {
        await tx.dynamicBlock.createMany({ data: toCreate });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
