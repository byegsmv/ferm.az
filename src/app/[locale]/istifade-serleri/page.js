export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "İstifadə Şərtləri — FermerMarket.az" };
}

const sections = [
  {
    h: "1. Ümumi müddəalar",
    p: "Bu şərtlər www.fermermarket.az Platformasından istifadə edən bütün istifadəçilərə aiddir. Platformadan istifadə etməklə bu şərtləri qəbul etmiş sayılırsınız.",
  },
  {
    h: "2. Hesab və qeydiyyat",
    p: "Qeydiyyat zamanı dəqiq və aktual məlumatlar təqdim etməlisiniz. Hesabınızın təhlükəsizliyinə görə məsuliyyət daşıyırsınız. Platforma qaydaları pozan hesabları müvəqqəti və ya daimi bağlamaq hüququnu saxlayır.",
  },
  {
    h: "3. Elanlar",
    p: "Elanlarda dəqiq məlumat (məhsulun adı, qablaşdırma ölçüsü, qiymət) verilməlidir. Məhsullar «ədəd» (bağ/qab) vahidi ilə satışa təqdim olunur. Yalançı, qeyri-qanuni və ya qəbul edilməz elanlar silinə bilər. Elan məzmununa görə məsuliyyət elanın sahibinə aiddir.",
  },
  {
    h: "4. Mağazalar",
    p: "Elan yerləşdirmək üçün mağaza sahibi olmaq və ya qonaq elanı qaydalarına əməl etmək tələb olunur. Mağaza açarkən istifadəçi müqaviləsinin şərtləri qəbul edilir. Mağazalar Platforma tərəfindən yoxlanışdan keçə bilər.",
  },
  {
    h: "5. Ödənişlər",
    p: "Reklam və məhsul xidmətlərinin ödənişləri M10 (+994 10 223 89 89) və ya kart vasitəsilə edilir. Ödəniş təsdiqi (dekont) WhatsApp üzərindən göndərilir. Xidmət yalnız ödənişin təsdiqlənməsindən sonra aktivləşir.",
  },
  {
    h: "6. Reklam xidmətləri",
    p: "Platformada göstərilən premium reklam yerləri müəyyən müddətə satılır. Reklam materialları Platformanın dəyərlərinə və qanunvericiliyə zidd olmamalıdır. Reklam müddəti bitdikdə material avtomatik göstərilməkdən dayanır.",
  },
  {
    h: "7. Məsuliyyətin məhdudluğu",
    p: "Platforma alıcı və satıcı arasındakı əməliyyatların icrasına görə birbaşa məsuliyyət daşımır. Satıcıların məhsul keyfiyyətinə, çatdırılmaya və ödənişə dair öhdəlikləri satıcıya aiddir.",
  },
  {
    h: "8. Şərtlərin dəyişdirilməsi",
    p: "Platforma bu şərtləri əvvəlcədən xəbərdarlıq etmədən yeniləyə bilər. Yenilənmiş versiya saytında dərc olunduğu andan qüvvəyə minir. Əlaqə: info@fermermarket.az | WhatsApp: +994 10 223 89 89. Son yeniləmə: sentyabr 2026.",
  },
];

export default async function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900">İstifadə Şərtləri</h1>
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
