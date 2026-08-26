import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Fermer Klubu & Bonuslar — FermerMarket",
  description: "FermerMarket-ə qoşulun, referallardan bonus qazanın və xüsusi endirimlərdən yararlanın.",
};

export default function FarmerClubPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-700 to-green-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3">
          <Icon name="award" size={40} /> Fermer Klubu
        </h1>
        <p className="text-lg md:text-xl text-green-50 max-w-2xl mx-auto">
          Dostunuzu dəvət edin, birlikdə <span className="font-bold text-yellow-300">FermerCoin (FC)</span> qazanın və platformamızda endirimlərlə alış-veriş edin!
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="users" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">1. Dəvət Et</h3>
            <p className="text-gray-500 text-sm">
              Öz referal linkini digər fermerlərlə və dostlarınla paylaş.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="coins" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">2. Bonus Qazan</h3>
            <p className="text-gray-500 text-sm">
              Dostun qeydiyyatdan keçib ilk sifarişini edəndə hər ikiniz 10 FC qazanırsınız.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="shopping-bag" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">3. Endirim Al</h3>
            <p className="text-gray-500 text-sm">
              Topladığınız FermerCoin-ləri növbəti alış-verişlərinizdə real pul kimi (1 FC = 1 AZN) xərcləyin.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-900">Referal Linkinizi Götürün</h2>
            <p className="text-gray-600">Qazanmağa başlamaq üçün şəxsi kabinetinizə daxil olun.</p>
          </div>
          <Link href="/dashboard" className="px-8 py-4 bg-brand-600 text-white font-bold rounded-xl text-lg hover:bg-brand-700 whitespace-nowrap">
            Kabinetə Keç
          </Link>
        </div>

        {/* VIP Benefits */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Fermer Klubunun Digər Üstünlükləri</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-4">
              <Icon name="check-circle" size={24} className="text-brand-600 shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Pulsuz Aqronom Məsləhəti</h4>
                <p className="text-sm text-gray-500">Ayda 2 dəfə peşəkar aqronomlarımıza şəkil göndərib pulsuz rəy almaq şansı.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-4">
              <Icon name="check-circle" size={24} className="text-brand-600 shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Xüsusi Endirim Kampaniyaları</h4>
                <p className="text-sm text-gray-500">Yalnız klub üzvləri üçün bağlı kampaniyalara və limitli endirimlərə giriş.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
