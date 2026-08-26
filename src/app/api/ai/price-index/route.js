import { prisma } from "@/lib/prisma";
import { geminiGenerate, isModuleActive } from "@/lib/gemini";

// GET /api/ai/price-index — AI price forecast for a product category
export async function GET(request) {
  try {
    if (!(await isModuleActive("price-index"))) {
      return Response.json({ error: "Bu modul deaktiv edilib" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const productCategory = searchParams.get("category") || "ümumi";
    const months = parseInt(searchParams.get("months") || "6");

    // Get historical prices from orders
    const historicalData = await prisma.orderItem.findMany({
      where: {
        order: { status: { in: ["DELIVERED", "PAID"] } },
        product: { category: { nameAz: { contains: productCategory, mode: "insensitive" } } },
      },
      select: {
        price: true,
        createdAt: true,
        product: { select: { titleAz: true, category: { select: { nameAz: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Build context for AI
    const priceHistory = historicalData.map(h => ({
      date: h.createdAt.toISOString().slice(0, 10),
      price: Number(h.price),
      product: h.product.titleAz,
    }));

    const prompt = `Sən kənd təsərrüfatı bazar analitikisan. Azərbaycan dilində cavab ver.\n
Kateqoriya: ${productCategory}\n
Tarixi qiymət məlumatları: ${JSON.stringify(priceHistory.slice(-20))}\n
Gələcək ${months} ay üçün qiymət proqnozu ver.\n
JSON formatında cavab:\n[{"month":"Aydın","price":1.20,"trend":"yüksəliş/aşağı/sabit","note":"Qısa izah"}]\n
Yalnız JSON cavab ver.`;

    const aiResponse = await geminiGenerate({ prompt, maxOutputTokens: 1024 });

    let forecast = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) forecast = JSON.parse(jsonMatch[0]);
    } catch (e) {}

    if (!forecast.length) {
      // Fallback with basic trend analysis
      forecast = Array.from({ length: months }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i + 1);
        const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
        return {
          month: monthNames[date.getMonth()],
          price: priceHistory.length > 0
            ? Number((priceHistory[priceHistory.length - 1].price * (1 + (Math.random() - 0.3) * 0.2)).toFixed(2))
            : 1.00,
          trend: "təxmini",
          note: "AI analizi mövcud deyil, tarixi məlumat əsasında",
        };
      });
    }

    return Response.json({
      category: productCategory,
      historicalCount: priceHistory.length,
      forecast,
      rawAiResponse: aiResponse.slice(0, 500),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
