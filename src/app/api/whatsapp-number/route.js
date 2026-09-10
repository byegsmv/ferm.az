import { prisma } from "@/lib/prisma";

// GET /api/whatsapp-number — saytın ümumi WhatsApp nömrəsi (SiteText: whatsapp_number)
export async function GET() {
  const t = await prisma.siteText.findUnique({ where: { key: "whatsapp_number" } }).catch(() => null);
  const number = (t?.valueAz || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  return Response.json(
    { number },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
