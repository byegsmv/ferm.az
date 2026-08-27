
import { prisma } from "@/lib/prisma";
import { geminiGenerate } from "@/lib/gemini";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
    if (denied) return denied;

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Mesajlar tapılmadı" }, { status: 400 });
    }

    // Get real-time system stats to feed to Gemini
    const [userCount, productCount, activeProducts, orderCount, totalRevenueAggr, storeCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.store.count(),
    ]);

    const stats = {
      users: userCount,
      totalProducts: productCount,
      activeProducts: activeProducts,
      orders: orderCount,
      revenue: totalRevenueAggr._sum.totalAmount || 0,
      stores: storeCount
    };

    const historyText = messages.map(m => `${m.role === "user" ? "Admin" : "AI"}: ${m.content}`).join("\n");
    
    const prompt = `Sən FermerMarket.az-ın Admin Copilot-usan. Yalnız adminlərə xidmət edirsən.
Sənə sistemin ən son məlumatları (stats) verilib. Adminin suallarına bu məlumatlar əsasında cavab ver.
Əgər əlavə əməliyyat lazımdırsa, sənə verilən məlumatlarla kifayətlən.

SİSTEM STATİSTİKASI:
İstifadəçilər: ${stats.users}
Məhsullar: ${stats.totalProducts} (Aktiv: ${stats.activeProducts})
Sifarişlər: ${stats.orders}
Ümumi Qazanc: ${stats.revenue} AZN
Mağazalar: ${stats.stores}

Söhbət tarixçəsi:
${historyText}

Sənin cavabın:`;

    const aiResponse = await geminiGenerate({
      prompt,
      maxOutputTokens: 1024,
    });

    return Response.json({
      reply: aiResponse,
      dataView: { statSummary: stats }
    });
  } catch (error) {
    console.error("Admin Copilot Chat Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

