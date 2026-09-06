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
  const envCheck = {
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    JWT_ACCESS_SECRET: !!process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    XAI_API_KEY: !!process.env.XAI_API_KEY,
    VAPID_PUBLIC_KEY: !!process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || null,
  };
  return NextResponse.json({ hasUrl: !!url, host, dbname, parseErr, connect, envCheck });
}
