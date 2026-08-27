import { prisma } from "@/lib/prisma";
import { geminiGenerate } from "@/lib/gemini";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1. Fetch some context to generate SEO
    // Get recent 10 products
    const recentProducts = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { titleAz: true, category: { select: { nameAz: true } } }
    });

    // Get top 5 trending products
    const trendingProducts = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { titleAz: true }
    });

    // 2. Prepare Prompt
    const prompt = Sən FermerMarket.az üçün peşəkar SEO mütəxəssisisən.
Məqsədin saytın ana səhifəsi üçün bugünkü məhsul və trendlərə əsasən ən optimal, klik cəlb edən (CTR yüksək), Google axtarışlarına uyğun SEO Meta Title, Meta Description və Keywords yaratmaqdır.

Hazırda platformaya əlavə olunan son məhsullar:


Ən çox baxılan məhsullar:


Tələblər:
1. Title: 50-60 simvol arası, cəlbedici olsun, əsas sözləri saxlasın (məs: "FermerMarket - ...").
2. Description: 150-160 simvol, insanları cəlb etsin, kənd təsərrüfatı texnikası, toxum, gübrə və s. vurğulansın.
3. Keywords: Vergüllə ayrılmış 10-15 ən axtarılan aqrar söz (məsələn: fermer, kənd təsərrüfatı, toxumlar, traktor...).
Cavabı yalnız aşağıdakı formatda tam və düzgün JSON olaraq qaytar:
\\\json
{
  "title": "Ana Səhifə Başlığı",
  "description": "Meta description mətni",
  "keywords": "açar söz, ikinci söz, üçüncü..."
}
\\\
;

    // 3. Get AI generation
    const aiResponse = await geminiGenerate({
      prompt,
      maxOutputTokens: 1000
    });

    let jsonMatch = aiResponse.match(/`json\n([\s\S]*?)\n`/);
    if (!jsonMatch) {
       const fallbackMatch = aiResponse.match(/\{[\s\S]*\}/);
       if (fallbackMatch) {
         jsonMatch = [null, fallbackMatch[0]];
       } else {
         return NextResponse.json({ error: "Invalid JSON from AI", response: aiResponse }, { status: 500 });
       }
    }
    
    const parsed = JSON.parse(jsonMatch[1]);

    // 4. Update the DB settings
    await prisma.setting.upsert({
      where: { key: "seo.homepage.title" },
      update: { value: parsed.title, isPublic: true },
      create: { key: "seo.homepage.title", value: parsed.title, label: "SEO Title", isPublic: true }
    });

    await prisma.setting.upsert({
      where: { key: "seo.homepage.description" },
      update: { value: parsed.description, isPublic: true },
      create: { key: "seo.homepage.description", value: parsed.description, label: "SEO Description", isPublic: true }
    });

    await prisma.setting.upsert({
      where: { key: "seo.homepage.keywords" },
      update: { value: parsed.keywords, isPublic: true },
      create: { key: "seo.homepage.keywords", value: parsed.keywords, label: "SEO Keywords", isPublic: true }
    });

    return NextResponse.json({ success: true, seo: parsed });
  } catch (error) {
    console.error("AI SEO Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
