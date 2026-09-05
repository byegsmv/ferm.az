import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { geminiGenerate, isModuleActive } from "@/lib/gemini";
import {
  looksLikeListingIntent,
  extractListingDraft,
  resolveTargetStore,
  createListingFromDraft,
} from "@/lib/directListing";

export async function POST(req) {
  try {
    if (!(await isModuleActive("agronomist"))) {
      return Response.json({ error: "Bu modul deaktiv edilib" }, { status: 403 });
    }

    // Accept both JSON ({messages}) and multipart/form-data ({messages: JSON string, image: File})
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
      listingModeFlag = body.listingMode === true;
      imageBase64 = body.imageBase64 || null;
      imageMimeType = body.imageMimeType || "image/jpeg";
    }

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Mesajlar tapılmadı" }, { status: 400 });
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // ── Direct-listing mode ────────────────────────────────────────────────────
    // Authenticated staff can send a product photo + short info and have the
    // product published instantly (ACTIVE) into their store, right from the chat.
    const authUser = await getAuthUser(req);
    if (authUser) {
      const isStaff = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
      let canList = isStaff;
      if (!isStaff) {
        const mod = await prisma.userModule.findFirst({
          where: { userId: authUser.sub, module: "BULK_CSV" },
        });
        canList = !!mod;
      }
      // Text intent only (price pattern or add keywords) — an attached photo alone
      // must stay a normal disease-diagnosis chat even for staff.
      const wantsListing = listingModeFlag || looksLikeListingIntent(lastUserMsg);
      if (canList && wantsListing && (imageBase64 || lastUserMsg.trim())) {
        try {
          const { draft, missing } = await extractListingDraft({
            infoText: lastUserMsg,
            imageBase64,
            imageMimeType,
          });
          const { store, stores } = await resolveTargetStore(authUser.sub, lastUserMsg);

          const questions = [];
          if (!(Number(draft.price) > 0)) {
            questions.push(draft.price
              ? `Satış (pərakəndə) qiyməti nə qədərdir?`
              : (missing.find((m) => m.field === "price")?.question || "Satış (pərakəndə) qiyməti nə qədərdir?"));
          }
          if (!store && stores.length > 1) {
            questions.push(`Hansı mağazaya yerləşdirim: ${stores.map((s) => s.name).join(" / ")}?`);
          }

          if (questions.length === 0) {
            const imageDataUri = imageBase64
              ? `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`
              : null;
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
              reply: `✅ «${created.titleAz}» məhsulu ${store ? store.name + " mağazasında" : "şəxsi hesabında"} AKTİF olaraq yayımlandı!\n\n💰 Qiymət: ${priceLine}${wholeLine}\n📦 Stok: ${created.stock} ${created.unit}\n\nMəhsul səhifəsi: /products/${created.slug}\n\nBaşqa məhsul əlavə etmək istəyirsənsə, şəklini və qısa məlumatını göndər.`,
              products: [],
              listing: {
                created: true,
                slug: created.slug,
                title: created.titleAz,
                price: created.price,
                storeName: store ? store.name : null,
              },
            });
          }

          // Something is missing — ask, keep the draft client-side
          return Response.json({
            reply: `Məhsulu analiz etdim: «${draft.titleAz}».\n\nYayımlamaq üçün bir az məlumat lazımdır:\n${questions.map((q) => "• " + q).join("\n")}\n\nCavabını yaz — qalan hər şeyi mən hazırlamışam.`,
            products: [],
            listing: { created: false, draft, missing: questions },
          });
        } catch (e) {
          // Listing failed (AI/key issues) — fall back to normal agronomist chat,
          // but tell the staff user what went wrong so they can act on it.
          return Response.json({
            reply: `⚠️ Məhsul yerləşdirilə bilmədi: ${e.message}\n\nZəhmət olmasa AI Ayarları bölməsində Gemini açarını yoxlayın və yenidən cəhd edin.`,
            products: [],
          });
        }
      }
    }
    // ── End direct-listing mode ────────────────────────────────────────────────

    // Build context string from history
    const historyText = messages.map(m => `${m.role === "user" ? "Fermer" : "AI"}: ${m.content}`).join("\n");

    const prompt = `Sən FermerMarket.az-ın rəqəmsal AI Aqronomusan (Kənd təsərrüfatı mütəxəssisi).
Sən Azərbaycan dilində danışırsan, çox mehriban və köməksevərsən.
İstifadəçinin sənə verdiyi suala cavab ver. 
Əgər istifadəçi hər hansı gübrə, dərman (fungisid, insektisid), toxum və ya texnika barədə soruşursa, və ya bir xəstəliyin müalicəsini axtarırsa, tövsiyə etdiyin məhsulların ümumi (kateqoriya) adlarını xüsusi [PRODUCT:adı] formatında qeyd et. 
Məsələn: "Bunun üçün sizə [PRODUCT:fungisid] və ya [PRODUCT:Mis kuporosu] lazımdır."
Və ya "Torpağı gücləndirmək üçün [PRODUCT:NPK gübrəsi] istifadə edə bilərsiniz."

${imageBase64 ? "\nİstifadəçi son mesajına bitki/yarpaq/zərərverici şəkli əlavə edib — şəkli diqqətlə analiz et və diaqnozunu şəkilə əsaslandır.\n" : ""}
Budur söhbət tarixçəsi və son sual:
${historyText}

Sənin cavabın:`;

    const aiResponse = await geminiGenerate({
      prompt,
      imageBase64: imageBase64 || undefined,
      imageMimeType: imageBase64 ? imageMimeType : undefined,
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
