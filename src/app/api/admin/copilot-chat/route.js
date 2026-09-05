
import { prisma } from "@/lib/prisma";
import { geminiGenerate } from "@/lib/gemini";
import { getAuthUser, requireRole } from "@/lib/auth";
import {
  looksLikeListingIntent,
  extractListingDraft,
  resolveTargetStore,
  createListingFromDraft,
} from "@/lib/directListing";

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
    if (denied) return denied;

    // Accept both JSON ({messages}) and multipart/form-data ({messages, image})
    const contentType = req.headers.get("content-type") || "";
    let messages = null;
    let imageBase64 = null;
    let imageMimeType = null;
    let listingModeFlag = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      try { messages = JSON.parse(formData.get("messages") || "null"); } catch { messages = null; }
      listingModeFlag = (formData.get("listingMode") || "") === "1";
      const image = formData.get("image");
      if (image && image !== "null" && typeof image === "object" && image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        imageBase64 = buffer.toString("base64");
        imageMimeType = image.type || "image/jpeg";
      }
    } else {
      const body = await req.json();
      messages = body.messages;
    }

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Mesajlar tapılmadı" }, { status: 400 });
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // ── Direct-listing mode ────────────────────────────────────────────────────
    // Admin sends a product photo + short info right in Admin Copilot → AI
    // extracts a full draft and publishes it instantly (ACTIVE), same flow as
    // the AI Aqronom widget uses for other staff.
    const wantsListing = listingModeFlag || !!imageBase64 || looksLikeListingIntent(lastUserMsg);
    if (wantsListing && (imageBase64 || lastUserMsg.trim())) {
      try {
        const { draft, missing } = await extractListingDraft({
          infoText: lastUserMsg,
          imageBase64,
          imageMimeType,
        });
        const { store, stores } = await resolveTargetStore(authUser.sub, lastUserMsg);

        const questions = [];
        if (!(Number(draft.price) > 0)) {
          questions.push(missing.find((m) => m.field === "price")?.question || "Satış (pərakəndə) qiyməti nə qədərdir?");
        }
        if (!store && stores.length > 1) {
          questions.push(`Hansı mağazaya yerləşdirim: ${stores.map((s) => s.name).join(" / ")}?`);
        }

        if (questions.length === 0) {
          const imageDataUri = imageBase64 ? `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}` : null;
          const created = await createListingFromDraft({
            draft,
            store,
            sellerId: store?.ownerId || authUser.sub,
            imageDataUri,
          });
          const priceLine = `${created.price} AZN`;
          const wholeLine = created.wholesalePrice
            ? `, toptan ${created.wholesalePrice} AZN (min ${created.wholesaleMinQty} ədəd)`
            : "";
          return Response.json({
            reply: `✅ «${created.titleAz}» məhsulu ${store ? store.name + " mağazasında" : "şəxsi hesabında"} AKTİF olaraq yayımlandı!\n\n💰 Qiymət: ${priceLine}${wholeLine}\n📦 Stok: ${created.stock} ${created.unit}\n\nMəhsul səhifəsi: /products/${created.slug}`,
            listing: { created: true, slug: created.slug, title: created.titleAz, price: created.price, storeName: store ? store.name : null },
          });
        }

        return Response.json({
          reply: `Məhsulu analiz etdim: «${draft.titleAz}».\n\nYayımlamaq üçün bir az məlumat lazımdır:\n${questions.map((q) => "• " + q).join("\n")}\n\nCavabını yaz — qalan hər şeyi mən hazırlamışam.`,
          listing: { created: false, draft, missing: questions },
        });
      } catch (e) {
        return Response.json({
          reply: `⚠️ Məhsul yerləşdirilə bilmədi: ${e.message}\n\nZəhmət olmasa AI Ayarları bölməsində Gemini açarını yoxlayın və yenidən cəhd edin.`,
        });
      }
    }
    // ── End direct-listing mode ────────────────────────────────────────────────

    // Get real-time system stats to feed to Gemini
    const [userCount, productCount, activeProducts, orderCount, totalRevenueAggr, storeCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.store.count(),
    ]);

    const stats = {
      users: userCount,
      totalProducts: productCount,
      activeProducts: activeProducts,
      orders: orderCount,
      revenue: totalRevenueAggr._sum.total || 0,
      stores: storeCount
    };

    const historyText = messages.map(m => `${m.role === "user" ? "Admin" : "AI"}: ${m.content}`).join("\n");
    
    const prompt = `Sən FermerMarket.az-ın Admin Copilot-usan. Yalnız adminlərə xidmət edirsən.
Sənə sistemin ən son məlumatları (stats) verilib. Adminin suallarına bu məlumatlar əsasında cavab ver.

Əgər admin sistemdə bir MƏLUMATI DƏYİŞDİRMƏK, SİLMƏK və ya MODULU DEAKTİV/AKTİV ETMƏK istəyirsə (məsələn: e-poçt modulunu deaktiv et, məhsulu sil və s.), sən birbaşa bunu icra etmək üçün JSON bloku qaytarmalısan. 
Vercel mühitində fiziki faylları (kodu) silmək MÜMKÜN DEYİL! Buna görə yalnız verilənlər bazası (Prisma) üzərindən əməliyyatlar (məs: settings cədvəlində statusu dəyişmək) edə bilərsən.

Əməliyyat formatı mütləq belə olmalıdır (JSON bloku kod daxilində - \`\`\`json ilə yaz):
\`\`\`json
{
  "intent": "DB_MUTATION",
  "requires_confirmation": true_və_ya_false,
  "warning": "Yalnız requires_confirmation true olduqda zərərin açıqlaması",
  "prismaCode": "await prisma..."
}
\`\`\`

QAYDALAR:
1. "prismaCode" mütləq işlək prisma əmri olmalıdır. 
Vacib Modellər və Sahələri:
- Category: isActive (Boolean), slug, nameAz. (Status sahəsi yoxdur, deaktiv üçün isActive: false istifadə et!)
- Product: status (ProductStatus enum: DRAFT, PENDING_REVIEW, ACTIVE, SOLD, EXPIRED, REJECTED), isFeatured, isPremium.
- User: status (UserStatus enum: ACTIVE, BLOCKED, PENDING_VERIFICATION).
- Order: status (OrderStatus enum: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED).
- SiteText: key, valueAz, group, label. (Mətn, telefon nömrəsi, e-poçt dəyişmək üçün \`prisma.siteText.upsert\` istifadə et.)
- Setting: key, value, category. (Sistem modullarını aktiv/deaktiv etmək üçün \`prisma.setting.upsert\` istifadə et. Məs: value: "false")
2. ÇOX ƏHƏMİYYƏTLİ TƏHLÜKƏSİZLİK (SMART COPILOT): Əgər əməliyyat təhlükəlidirsə (modul deaktiv etmək, məlumat silmək, istifadəçi bloklamaq), "requires_confirmation": true və "warning" mesajı yaz. Əgər sadəcə telefon nömrəsi, mətn dəyişmək kimi zərərsiz bir əməliyyatdırsa, "requires_confirmation": false et və warning yazma. Beləliklə sistem bunu avtomatik icra edəcək.
3. Yalnız "admin" əməliyyat istəyirsə JSON qaytar, sadəcə "neçə sifariş var" soruşarsa normal mətn qaytar.

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
