
import { prisma } from "@/lib/prisma";
import { geminiGenerate, isModuleActive } from "@/lib/gemini";

export async function POST(req) {
  try {
    if (!(await isModuleActive("agronomist"))) {
      return Response.json({ error: "Bu modul deaktiv edilib" }, { status: 403 });
    }
    
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Mesajlar tapılmadı" }, { status: 400 });
    }

    // Build context string from history
    const historyText = messages.map(m => `${m.role === "user" ? "Fermer" : "AI"}: ${m.content}`).join("\n");
    
    const prompt = `Sən FermerMarket.az-ın rəqəmsal AI Aqronomusan (Kənd təsərrüfatı mütəxəssisi).
Sən Azərbaycan dilində danışırsan, çox mehriban və köməksevərsən.
İstifadəçinin sənə verdiyi suala cavab ver. 
Əgər istifadəçi hər hansı gübrə, dərman (fungisid, insektisid), toxum və ya texnika barədə soruşursa, və ya bir xəstəliyin müalicəsini axtarırsa, tövsiyə etdiyin məhsulların ümumi (kateqoriya) adlarını xüsusi [PRODUCT:adı] formatında qeyd et. 
Məsələn: "Bunun üçün sizə [PRODUCT:fungisid] və ya [PRODUCT:Mis kuporosu] lazımdır."
Və ya "Torpağı gücləndirmək üçün [PRODUCT:NPK gübrəsi] istifadə edə bilərsiniz."

Budur söhbət tarixçəsi və son sual:
${historyText}

Sənin cavabın:`;

    const aiResponse = await geminiGenerate({
      prompt,
      maxOutputTokens: 1024,
    });

    let reply = aiResponse;
    let products = [];
    
    // Extract [PRODUCT:name] tags
    const productTags = [...reply.matchAll(/\[PRODUCT:([^\]]+)\]/g)].map(m => m[1]);
    
    // Clean up the reply text by removing the tags brackets
    reply = reply.replace(/\[PRODUCT:([^\]]+)\]/g, "$1");

    if (productTags.length > 0) {
      // Find matching products
      const orConditions = productTags.flatMap(name => {
        const term = name.trim();
        return [
          { titleAz: { contains: term, mode: "insensitive" } },
          { descriptionAz: { contains: term, mode: "insensitive" } },
          { category: { nameAz: { contains: term, mode: "insensitive" } } }
        ];
      });

      products = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          stock: { gt: 0 },
          OR: orConditions,
        },
        take: 3,
        orderBy: { viewCount: "desc" },
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      });
      
      products = products.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.titleAz,
        price: Number(p.price),
        currency: p.currency || "AZN",
        coverImage: p.images?.[0]?.url || null,
      }));
    }

    return Response.json({
      reply,
      products
    });
  } catch (error) {
    console.error("Agronomist Chat Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

