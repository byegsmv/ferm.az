/**
 * FermerMarket Mağaza Paketləri — START / BUSINESS / PREMIUM
 * Qiymətlər admin tərəfindən /api/config/store-packages (PATCH) ilə dəyişdirilə bilər;
 * DB-də Setting("store_packages_config") yoxdursa bu standart dəyərlər işlənir.
 * Ödəniş: M10 (+994 10 223 89 89) — dekont WhatsApp-da təsdiqlənir (FermerMarket qaydası).
 */

export const PACKAGE_PAYMENT = {
  method: "M10",
  number: "+994 10 223 89 89",
  whatsappUrl: "https://wa.me/994102238989",
  note: "Ödəniş M10 (+994 10 223 89 89) hesabına edilir, dekontu WhatsApp-da göndərərək təsdiqləyin.",
};

export const DEFAULT_STORE_PACKAGES = [
  {
    key: "START",
    badge: "🥉",
    name: "START",
    price: 49,
    currency: "AZN",
    tagline: "Onlayn fəaliyyətin başlanğıcı — mağazanızı platformada yaradın",
    features: [
      "FermerMarket-də mağazanın yaradılması",
      "Məhsul və elanların mağazada yerləşdirilməsi",
      "Elanların paylaşılması",
      "Elanların platformada digər istifadəçilərə təqdim olunması",
    ],
  },
  {
    key: "BUSINESS",
    badge: "🥈",
    name: "BUSINESS",
    price: 89,
    currency: "AZN",
    popular: true,
    tagline: "Daha çox alıcıya çatın — platforma daxili reklam ilə",
    features: [
      "START paketindəki bütün imkanlar",
      "FermerMarket daxilində mağaza reklamı",
      "Elanların daha çox istifadəçiyə göstərilməsi",
      "Mağazanın platforma daxilində tanıtımının artırılması",
    ],
  },
  {
    key: "PREMIUM",
    badge: "🥇",
    name: "PREMIUM",
    price: 129,
    currency: "AZN",
    tagline: "Maksimum görünürlük — platforma + sosial şəbəkələr üzrə kompleks tanıtım",
    features: [
      "BUSINESS paketindəki bütün imkanlar",
      "Elanların önə çıxarılması",
      "Sosial şəbəkələrdə reklam və tanıtım",
      "Mağazanın daha geniş auditoriyaya çatdırılması",
      "Platforma + sosial şəbəkələr üzrə kompleks tanıtım",
    ],
  },
];

export const PACKAGE_KEYS = DEFAULT_STORE_PACKAGES.map((p) => p.key);

export function findStorePackage(key) {
  if (!key) return null;
  return DEFAULT_STORE_PACKAGES.find((p) => p.key === String(key).toUpperCase()) || null;
}
