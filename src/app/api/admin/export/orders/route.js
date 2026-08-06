import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/admin/export/orders — CSV export of all orders for offline analysis in Excel
export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { fullName: true, email: true } },
      items: { include: { product: { select: { titleAz: true } } } },
    },
  });

  const header = [
    "OrderID",
    "Tarix",
    "Alıcı",
    "Email",
    "Məhsullar",
    "Status",
    "Cəm məbləğ",
    "Valyuta",
    "Endirim",
    "Komissiya",
    "Bölgə",
    "Şəhər",
  ];

  const rows = orders.map((o) => [
    o.id,
    o.createdAt.toISOString(),
    o.buyer.fullName,
    o.buyer.email,
    o.items.map((i) => `${i.product.titleAz} x${i.quantity}`).join(" | "),
    o.status,
    o.total,
    o.currency,
    o.discount,
    o.commission,
    o.shippingRegion || "",
    o.shippingCity || "",
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fermermarket-sifarisler-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
