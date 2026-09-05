import { NextResponse } from "next/server";
import { migrateBlogImages, requalifyBlobImages } from "@/lib/blogImages";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Re-hosts pollinations.ai images (rate-limited / unreliable → broken images)
 * on Vercel Blob for ALL blog posts that still reference them.
 * Called daily by Vercel cron; also safe to call manually.
 */
export async function GET(request) {
  const ua = request.headers.get("user-agent") || "";
  const secret = request.headers.get("x-cron-secret");
  const isVercelCron = ua.includes("vercel-cron") || ua.includes("vercel-cron/v");
  const hasSecret = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
  if (!isVercelCron && !hasSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const migrateResult = await migrateBlogImages(30000);
  const requalifyResult = await requalifyBlobImages(25000);
  return NextResponse.json({ success: true, migrate: migrateResult, requalify: requalifyResult });
}
