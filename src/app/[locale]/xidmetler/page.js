import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";
import { getSiteTexts } from "@/lib/siteTexts";

export const metadata = {
  title: "Xidmətlər",
  description: "FermerMarket xidmətləri: Satınalma xidməti və Məhsulların qeydiyyata alınması.",
};

export default async function ServicesPage() {
  const siteTexts = await getSiteTexts();
  const t = (key, fallback) => siteTexts[key] || fallback;

  const services = [
    {
      href: "/xidmetler/satinalma",
      title: "Satınalma Xidməti",
      description: "Biznesiniz üçün lazımi məhsulların ən yaxşı qiymətə tapılması və alınmasında sizə köməklik edirik.",
      icon: "shoppingBag",
      color: "blue",
    },
    {
      href: "/xidmetler/mehsul-qeydiyyati",
      title: "Məhsulların Qeydiyyata Alınması",
      description: "Yeni kənd təsərrüfatı məhsullarının, gübrələrin və dərmanların rəsmi qeydiyyatı üçün müraciət edin.",
      icon: "clipboard",
      color: "emerald",
    }
  ];

  const getColorClasses = (color) => {
    switch(color) {
      case "blue": return "bg-blue-100 text-blue-600";
      case "emerald": return "bg-emerald-100 text-emerald-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Xidmətlər</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            FermerMarket platforması tərəfindən təklif olunan peşəkar xidmətlərdən faydalanın.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <Link 
              key={index} 
              href={service.href}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${getColorClasses(service.color)} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Icon name={service.icon} size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{service.title}</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                {service.description}
              </p>
              <div className="inline-flex items-center gap-2 text-brand-600 font-bold group-hover:gap-3 transition-all">
                Müraciət et <Icon name="arrowRight" size={18} />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
