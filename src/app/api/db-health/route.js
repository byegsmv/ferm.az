import { NextResponse } from "next/server";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== "fm-diag-8241") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const url = process.env.DATABASE_URL || "";
  let host = null, dbname = null, parseErr = null;
  try {
    const u = new URL(url);
    host = u.hostname;
    dbname = u.pathname.slice(1);
  } catch (e) {
    parseErr = String(e.message);
  }
  let connect = null;
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const products = await prisma.product.count();
    const stores = await prisma.store.count();
    const users = await prisma.user.count();
    await prisma.$disconnect();
    connect = { ok: true, products, stores, users };
  } catch (e) {
    connect = { ok: false, error: String(e.message).slice(0, 400) };
  }
  return NextResponse.json({ hasUrl: !!url, host, dbname, parseErr, connect });
}
