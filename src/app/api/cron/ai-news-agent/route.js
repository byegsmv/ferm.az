import { prisma } from "@/lib/prisma";
import { geminiGenerate } from "@/lib/gemini";
import { normalizeBlogContent } from "@/lib/blogContent";
import { persistBlogImages } from "@/lib/blogImages";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// RSS mənbələri — sırayla cəhd olunur. report.az 2026-09-dan datasenter
// İP-lərini (Vercel daxil) 403 ilə bloklayır; apa.az eyni formatda işləyir.
// Hər mənbə CDATA və ya sadə <title> formatında ola bilər — hər ikisi oxunur.
const RSS_SOURCES = [
  { name: "apa.az", url: "https://apa.az/rss" },
  { name: "report.az", url: "https://report.az/rss/" },
  { name: "az.trend.az", url: "https://az.trend.az/rss" },
];

function stripTags(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function fetchRssItems() {
  for (const source of RSS_SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        console.warn(`[ai-news-agent] ${source.name} HTTP ${res.status} — növbəti mənbə`);
        continue;
      }
      const rssText = await res.text();

      // Həm CDATA, həm sadə format: <title>X</title> və <title><![CDATA[X]]></title>
      const items = [];
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const match of itemMatches) {
        const itemStr = match[1];
        const titleMatch = itemStr.match(/<title>([\s\S]*?)<\/title>/);
        const descMatch = itemStr.match(/<description>([\s\S]*?)<\/description>/);
        const title = titleMatch ? stripTags(titleMatch[1]) : "";
        if (title) {
          items.push({ title, description: descMatch ? stripTags(descMatch[1]).slice(0, 300) : "" });
        }
      }
      if (items.length > 0) {
        console.log(`[ai-news-agent] ${source.name}: ${items.length} xəbər alındı`);
        return items;
      }
    } catch (err) {
      console.warn(`[ai-news-agent] ${source.name} xəta: ${err?.message} — növbəti mənbə`);
    }
  }
  return [];
}

export async function GET(req) {
  // 1. Fetch RSS feed — çoxmənbəli (apa.az → report.az → trend.az)
  const items = await fetchRssItems();
  if (!items.length) {
    return NextResponse.json({ error: "Bütün RSS mənbələri əlçatmazdır" }, { status: 500 });
  }

  // Take top 40 items
  const recentNews = items.slice(0, 40);
  const newsListStr = recentNews.map((n, i) => `${i+1}. Başlıq: ${n.title}\n   Qısa məzmun: ${n.description}`).join('\n\n');

  // 3. Prepare AI Prompt
  const prompt = `Sən FermerMarket üçün çox ağıllı, yaradıcı və peşəkar bir aqrar AI jurnalisitsən.
Aşağıda son xəbərlərin siyahısı verilib. Bu xəbərləri dərindən analiz et. Onlardan yalnız kənd təsərrüfatı, fermerlik, aqronomiya, ekologiya və aqrar iqtisadiyyata aid olanları seç.
Seçdiyin xəbərlərin məzmununu qısalt, lakin tam və əsas fikri izah edən, fermerlər üçün çox faydalı və cəlbedici bir bloq məqaləsi (post) halına gətir.

Tələblər:
1. Başlıq (Title) çox cəlbedici və məqalənin məzmununu tam əks etdirən olsun.
2. Mətnin mükəmməl giriş, əsas hissə və yekun hissəsi olsun. Mətn Azərbaycan dilində olmalıdır. Fikirləri aydın, anlaşıqlı və peşəkar şəkildə izah et.
3. Fermerlərə bu xəbərlərin (və ya yeniliklərin) nə üçün əhəmiyyətli olduğunu, onların işinə necə təsir edə biləcəyini izah et.
4. Məqaləni HTML formatında qaytar. <div>, <p>, <h3>, <ul>, <li>, <strong>, <br> kimi teqlərdən istifadə edərək mətni gözəl strukturlaşdır.
   ÇOX VACİB: contentAz dəyəri DAXİLİNƏ heç bir markdown kod bloku (\`\`\` və ya \`\`\`html) YAZMA. Yalnız təmiz HTML teqləri olmalıdır. Markdown işarələri (**bold**, # başlıq) istifadə etmə — yalnız HTML teqləri.
5. Məqaləyə uyğun olaraq vizual zənginlik qatmaq üçün mətnin daxilinə və məqalənin üz qabığı (coverUrl) üçün süni intellekt vasitəsilə şəkillər əlavə et. 
   Şəkil yaratmaq üçün bu URL formatından istifadə et: "https://image.pollinations.ai/prompt/{ingilisce-detalli-tesvir}?width=1600&height=1200&nologo=true".
   Məsələn, xəbər pambıqçılıq barədədirsə, mətnin daxilinə belə bir teq qoy: <img src="https://image.pollinations.ai/prompt/farmers-harvesting-cotton-in-field-realistic-high-quality-photography?width=1600&height=780&nologo=true" alt="Pambıq yığımı" class="w-full rounded-xl my-4" />
6. ƏGƏR siyahıda kənd təsərrüfatına aid HEÇ BİR xəbər yoxdursa, bugünkü gün üçün fermerlərə mövsümə uyğun çox faydalı, elmi və praktik bir aqrar məsləhət və ya dərin analitik məqalə yaz.
7. Ən sonda <hr class="my-6 border-gray-200" /><p class="text-sm text-gray-500 italic">Bu xəbər xülasəsi FermerMarket AI Agent tərəfindən avtomatik toplanmış və tərtib edilmişdir.</p> əlavə et.

Sənə qaytarılacaq yeganə nəticə aşağıdakı kimi dəqiq bir JSON olmalıdır:
\`\`\`json
{
  "titleAz": "Bloqun cəlbedici başlığı",
  "contentAz": "Bloqun strukturlaşdırılmış, daxilində <img> teqləri (pollinations) olan HTML mətni",
  "coverUrl": "https://image.pollinations.ai/prompt/beautiful-agriculture-farm-landscape-high-quality?width=1600&height=900&nologo=true"
}
\`\`\`

Budur son xəbərlər:
${newsListStr}`;

  try {
    const aiResponse = await geminiGenerate({
      prompt,
      maxOutputTokens: 3000
    });

    // 4. Parse AI response
    let jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
       // try finding just curly braces
       const fallbackMatch = aiResponse.match(/\{[\s\S]*\}/);
       if (fallbackMatch) {
         jsonMatch = [null, fallbackMatch[0]];
       } else {
         return NextResponse.json({ error: "AI didn't return valid JSON", response: aiResponse }, { status: 500 });
       }
    }
    
    const parsed = JSON.parse(jsonMatch[1]);
    
    // 5. Save to database
    // Get an admin user ID for authorId
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
    });
    
    if (!adminUser) {
      return NextResponse.json({ error: "No admin user found to be author" }, { status: 500 });
    }
    
    // Create unique slug
    const generateSlug = (text) => text.toString().toLowerCase()
      .replace(/ə/g, 'e').replace(/ö/g, 'o').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ç/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    // Provide a default cover image for AI news
    let coverUrl = "https://www.fermermarket.az/img/blog-ai-placeholder.jpg";
    if (parsed.coverUrl && /^https:\/\//i.test(parsed.coverUrl) && !/javascript:/i.test(parsed.coverUrl)) {
      coverUrl = parsed.coverUrl;
    }

    // Clean the AI output: strip code fences / escaped entities / dangerous tags
    const cleanContent = normalizeBlogContent(parsed.contentAz);
    const cleanTitle = String(parsed.titleAz || "").replace(/```[a-zA-Z]*\n?/g, "").trim();
    if (!cleanTitle || !cleanContent) {
      return NextResponse.json({ error: "AI returned empty title/content" }, { status: 500 });
    }

    // Re-host AI-generated (pollinations) images on blob storage so they load
    // reliably and never appear broken to visitors.
    const persisted = await persistBlogImages(cleanContent, coverUrl);
    const finalContent = persisted.content;
    const finalCoverUrl = persisted.coverUrl;

    const blogPost = await prisma.blogPost.create({
      data: {
        slug: generateSlug(cleanTitle) + '-' + Math.random().toString(36).substring(2, 8),
        titleAz: cleanTitle,
        contentAz: finalContent,
        category: "Aqrar Xəbərlər",
        authorId: adminUser.id,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 0,
        coverUrl: finalCoverUrl
      }
    });

    return NextResponse.json({ success: true, post: blogPost });

  } catch (error) {
    console.error("AI News Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
