import { prisma } from "@/lib/prisma";
import { DEFAULT_STORE_PACKAGES, PACKAGE_PAYMENT } from "@/lib/storePackages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Mağaza Paketləri — FermerMarket.az" };
}

async function getPackages() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "store_packages_config" },
    });
    if (setting?.value) {
      const saved = JSON.parse(setting.value);
      if (Array.isArray(saved) && saved.length) return saved;
    }
  } catch {
    // DB xətası olursa standart paketlər göstərilir
  }
  return DEFAULT_STORE_PACKAGES;
}

const ring = {
  START: "border-amber-300",
  BUSINESS: "border-gray-300",
  PREMIUM: "border-yellow-400",
};
const emojiBg = {
  START: "bg-amber-50",
  BUSINESS: "bg-gray-50",
  PREMIUM: "bg-yellow-50",
};

export default async function PackagesPage() {
  const packages = await getPackages();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
      {/* Başlıq */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl font-black text-gray-900">
          🌱 FermerMarket Mağaza Paketləri
        </h1>
        <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
          FermerMarket-də mağazanızı qeydiyyatdan keçirin, məhsul və elanlarınızı minlərlə alçıya
          təqdim edin. Bütün paketlərdə mağaza yaratmaq, məhsul və elan yerləşdirmək mövcuddur —
          paket səviyyəsi nə qədər yüksəkdirsə, tanıtımınız bir o qədər geniş olur.
        </p>
      </div>

      {/* Kartlar */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {packages.map((p) => (
          <div
            key={p.key}
            className={`relative rounded-2xl border-2 ${ring[p.key] || "border-gray-200"} bg-white p-6 flex flex-col shadow-sm hover:shadow-lg transition-shadow`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Ən çox seçilən
              </span>
            )}
            <div className={`inline-flex w-12 h-12 items-center justify-center rounded-xl ${emojiBg[p.key] || "bg-gray-50"} text-2xl`}>
              {p.badge}
            </div>
            <h2 className="mt-3 text-xl font-black text-gray-900">{p.name}</h2>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-black text-brand-700">{p.price}</span>
              <span className="text-sm font-bold text-gray-500">AZN</span>
            </div>
            <p className="mt-2 text-xs font-medium text-gray-500">{p.tagline}</p>
            <ul className="mt-4 space-y-2.5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="/az/elan-yerlesdir"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold py-3 transition-colors"
            >
              {p.name} ilə başla
            </a>
          </div>
        ))}
      </div>

      {/* Qısa fərq */}
      <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Qısa fərq</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
          <p><span className="font-bold">49 AZN</span> → Mağaza + Elan</p>
          <p><span className="font-bold">89 AZN</span> → Mağaza + Elan + Platforma daxili reklam</p>
          <p><span className="font-bold">129 AZN</span> → Mağaza + Elan + Platforma daxili reklam + Sosial şəbəkə reklamı</p>
        </div>
      </div>

      {/* Ödəniş qaydası */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <h3 className="text-sm font-black text-gray-800">💳 Ödəniş qaydası</h3>
        <p className="mt-2 text-sm text-gray-700 leading-7">
          Ödəniş <span className="font-bold">{PACKAGE_PAYMENT.method} ({PACKAGE_PAYMENT.number})</span> hesabına edilir.
          Ödənişdən sonra dekontu WhatsApp-da göndərərək təsdiqləyin — paketiniz dərhal aktivləşdirilir.
        </p>
        <a
          href={PACKAGE_PAYMENT.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1eb85a] text-white text-sm font-bold px-5 py-3 transition-colors"
        >
          WhatsApp ilə ödənişi təsdiqlə
        </a>
      </div>

      {/* Suallar */}
      <p className="mt-8 text-center text-sm text-gray-500">
        Suallarınız üçün: <a href="mailto:info@fermermarket.az" className="font-bold text-brand-700">info@fermermarket.az</a> · WhatsApp: <span className="font-bold">+994 10 223 89 89</span>
      </p>
    </div>
  );
}
