import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { sellerId, productId, name, company, quantity, message } = await req.json();

    if (!sellerId || !name || !quantity || !message) {
      return NextResponse.json({ error: "Eksik məlumatlar." }, { status: 400 });
    }
    
    await prisma.notification.create({
      data: {
        userId: sellerId,
        type: "b2b_quote",
        title: "Yeni Kotirovka Tələbi",
        body: `${name} ${company ? `(${company})` : ""} tərəfindən ${quantity} ədəd üçün sorğu: "${message}"`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("B2B quote error:", error);
    return NextResponse.json({ error: "Daxili xəta baş verdi." }, { status: 500 });
  }
}
