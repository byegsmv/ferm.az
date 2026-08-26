import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // Clear the HttpOnly cookie — client can't do this itself
  res.headers.set("Set-Cookie", "fmk_access_token=; Path=/; Max-Age=0; SameSite=Lax");
  return res;
}
