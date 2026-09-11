export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Məxfilik Siyasəti — FermerMarket.az" };
}

const sections = [
  {
    h: "1. Ümumi müddəalar",
    p: "FermerMarket.az (bundan sonra «Platforma») istifadəçilərinin şəxsi məlumatlarının qorunmasına ciddi yanaşır. Bu siyasət Platformadan istifadə edərkən topladığımız məlumatların növlərini, istifadə məqsədlərini və hüquqlarınızı izah edir.",
  },
  {
    h: "2. Toplanan məlumatlar",
    p: "Hesab məlumatları (ad, e-poçt, telefon), elan və mağaza məlumatları, sifariş məlumatları, ödəniş təsdiqi (M10 dekont bildirişləri — kart məlumatları bizdə saxlanılmır), texniki məlumatlar (IP ünvanı, brauzer növü, cihaz məlumatları).",
  },
  {
    h: "3. Analitika və reklam texnologiyaları",
    p: "Platforma keyfiyyətini artırmaq və maraqlı xidmətləri göstərmək üçün cookie faylları və üçüncü tərəf reklam/analitika piksellərindən (Meta/Facebook, Instagram, TikTok, Google) istifadə oluna bilər. Bu piksellər Platformada hansı hərəkətləri etdiyinizi anonim şəkildə ölçməyə kömək edir və sizə uyğun reklamların göstərilməsini təmin edir.",
  },
  {
    h: "4. Məlumatların istifadəsi",
    p: "Toplanan məlumatlar yalnız: hesabınızın işlədilməsi, elanların yerləşdirilməsi, sifarişlərin icrası, müştəri dəstəyi, Platformanın təhlükəsizliyi və reklam kampaniyalarının optimallaşdırılması məqsədilə istifadə olunur. Məlumatlarınız üçüncü tərəflərə satılmır.",
  },
  {
    h: "5. Sizin hüquqlarınız",
    p: "İstənilən vaxt hesabınızın və şəxsi məlumatlarınızın silinməsini, düzəldilməsini və ya istifadəsinə dair məlumat almağı tələb edə bilərsiniz. Müraciətlər: info@fermermarket.az",
  },
  {
    h: "6. Cookie idarəetməsi",
    p: "Brauzerinizin parametrlərindən cookie-ları bloklaya və ya silə bilərsiniz. Bəzi funksiyalar bu halda məhdudlaşa bilər.",
  },
  {
    h: "7. Əlaqə",
    p: "Bu siyasətlə bağlı suallar üçün bizimlə əlaqə saxlayın: info@fermermarket.az | WhatsApp: +994 10 223 89 89. Son yeniləmə: sentyabr 2026.",
  },
];

export default async function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Məxfilik Siyasəti</h1>
      <p className="mt-2 text-sm text-gray-500">FermerMarket.az — www.fermermarket.az</p>
      <div className="mt-8 space-y-7">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-bold text-gray-800">{s.h}</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
