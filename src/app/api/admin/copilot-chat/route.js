
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

