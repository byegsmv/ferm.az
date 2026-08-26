import { prisma } from "@/lib/prisma";
import { geminiGenerate, isModuleActive } from "@/lib/gemini";

// POST /api/ai/agronomist — AI disease detection + product recommendation via Gemini
export async function POST(req) {
  try {
    if (!(await isModuleActive("agronomist"))) {
      return Response.json({ error: "Bu modul deaktiv edilib" }, { status: 403 });
    }
    const formData = await req.formData();
    const text = formData.get("text") || "";
    const image = formData.get("image");

    const isImage = !!image && image !== "null";

    // Build Gemini prompt
    let prompt = `Sən peşəkar aqronomsan. Azərbaycan dilində cavab ver.\n`;
    prompt += `İstifadəçinin təsviri: "${text || "Təsvir verilməyib"}"\n`;
    prompt += `Şəkil yüklənib: ${isImage ? "Bəli" : "Xeyr"}\n`;
    prompt += `\nJSON formatında cavab ver:\n`;
    prompt += `{\n  "diagnosis": "Xəstəlik/zərərverici adı Azərbaycanca",\n`;
    prompt += `  "confidencePercent": 85,\n`;
    prompt += `  "causes": ["Səbəb 1", "Səbəb 2"],\n`;
    prompt += `  "treatment": ["Müalicə 1", "Müalicə 2"],\n`;
    prompt += `  "recommendedProducts": ["Məhsul adı 1", "Məhsul adı 2"],\n`;
    prompt += `  "needsExpertConsult": false,\n`;
    prompt += `  "summary": "Qısa tövsiyə Azərbaycanca"\n}\n`;
    prompt += `Yalnız JSON cavab ver, başqa mətn yazma.`;

    // Call Gemini (with image if available)
    let imageBase64 = null;
    let imageMimeType = null;
    if (isImage) {
      const buffer = Buffer.from(await image.arrayBuffer());
      imageBase64 = buffer.toString("base64");
      imageMimeType = image.type || "image/jpeg";
    }

    const aiResponse = await geminiGenerate({
      prompt,
      imageBase64,
      imageMimeType,
      maxOutputTokens: 1024,
    });

    // Parse AI response
    let diagnosis = null;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // JSON parse failed, use raw text
    }

    // If AI gave a proper diagnosis, find matching products from DB
    let products = [];
    if (diagnosis && diagnosis.recommendedProducts) {
      const productNames = diagnosis.recommendedProducts.map(p => p.toLowerCase());
      const orConditions = productNames.flatMap(name => [
        { titleAz: { contains: name, mode: "insensitive" } },
        { titleEn: { contains: name, mode: "insensitive" } },
        { titleRu: { contains: name, mode: "insensitive" } },
        { descriptionAz: { contains: name, mode: "insensitive" } },
      ]);

      if (orConditions.length > 0) {
        products = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            stock: { gt: 0 },
            OR: orConditions,
          },
          take: 4,
          orderBy: { viewCount: "desc" },
          include: {
            images: { take: 1, orderBy: { sortOrder: "asc" } },
            store: { select: { name: true, slug: true } },
          },
        });
      }
    }

    // Fallback: if no products found via AI names, try category-based search
    if (products.length === 0 && diagnosis) {
      const diagText = (diagnosis.diagnosis || "").toLowerCase();
      let categoryFilter = {};
      if (diagText.includes("göbələk") || diagText.includes("fung")) {
        categoryFilter = { OR: [{ category: { nameAz: { contains: "Fungisid" } } }, { titleAz: { contains: "fungisid", mode: "insensitive" } }] };
      } else if (diagText.includes("böcək") || diagText.includes("zərər") || diagText.includes("insekt")) {
        categoryFilter = { OR: [{ category: { nameAz: { contains: "İnsektisid" } } }, { titleAz: { contains: "insektisid", mode: "insensitive" } }] };
      } else if (diagText.includes("qida") || diagText.includes("çatış") || diagText.includes("gübrə")) {
        categoryFilter = { OR: [{ category: { nameAz: { contains: "gübrə" } } }, { category: { nameAz: { contains: "Maye" } } }, { titleAz: { contains: "NPK", mode: "insensitive" } }] };
      }

      if (Object.keys(categoryFilter).length > 0) {
        products = await prisma.product.findMany({
          where: { status: "ACTIVE", stock: { gt: 0 }, ...categoryFilter },
          take: 4,
          orderBy: { viewCount: "desc" },
          include: {
            images: { take: 1, orderBy: { sortOrder: "asc" } },
            store: { select: { name: true, slug: true } },
          },
        });
      }
    }

    // Final fallback: just show popular products
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { status: "ACTIVE", stock: { gt: 0 } },
        take: 4,
        orderBy: { viewCount: "desc" },
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          store: { select: { name: true, slug: true } },
        },
      });
    }

    // Spray timing recommendation
    const now = new Date();
    const hour = now.getHours();
    let sprayTime = "Səhər tezdən (06:00-08:00) və ya axşam üzeri (18:00-20:00)";
    if (hour >= 6 && hour < 10) sprayTime = "İndi çiləmə üçün əlverişli vaxtdır (səhər)";
    else if (hour >= 18 && hour < 21) sprayTime = "İndi çiləmə üçün əlverişli vaxtdır (axşam)";
    else if (hour >= 10 && hour < 18) sprayTime = "Çiləmə üçün əlverişsiz vaxt — günəş yanığı riski. Axşam 18:00-dan sonra çiləyin.";
    else sprayTime = "Gecə çiləmək tövsiyə olunmur. Səhər 06:00-08:00 çiləyin.";

    return Response.json({
      disease: diagnosis?.diagnosis || "Analiz tamamlandı",
      confidence: diagnosis?.confidencePercent ? `${diagnosis.confidencePercent}%` : "—",
      recommendation: diagnosis?.summary || diagnosis?.treatment?.join(". ") || aiResponse.slice(0, 300),
      causes: diagnosis?.causes || [],
      treatment: diagnosis?.treatment || [],
      sprayTime,
      needsExpertConsult: diagnosis?.needsExpertConsult || false,
      rawAiResponse: aiResponse.slice(0, 500),
      products: products.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.titleAz,
        price: Number(p.price),
        currency: p.currency || "AZN",
        coverImage: p.images?.[0]?.url || null,
        store: p.store?.name || null,
        manufacturer: p.manufacturer || null,
        preparativeForm: p.preparativeForm || null,
        useNorm: p.useNorm || null,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
