"use client";
import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";
import { useSiteTexts } from "@/lib/siteTexts";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1LDQEgQBcd/?mibextid=wwXIfr",
    color: "hover:bg-blue-600 hover:text-white hover:border-blue-600",
    svg: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
  },
  {
    name: "Instagram",
    href: "#",
    color: "hover:bg-pink-600 hover:text-white hover:border-pink-500",
    svg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
  },
  {
    name: "Telegram",
    href: "#",
    color: "hover:bg-sky-500 hover:text-white hover:border-sky-500",
    svg: '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>',
  },
  {
    name: "WhatsApp",
    href: "#",
    color: "hover:bg-green-500 hover:text-white hover:border-green-500",
    svg: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>',
  },
  {
    name: "YouTube",
    href: "#",
    color: "hover:bg-red-600 hover:text-white hover:border-red-600",
    svg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
  },
  {
    name: "TikTok",
    href: "#",
    color: "hover:bg-gray-900 hover:text-white hover:border-gray-900",
    svg: '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>',
  },
];

export default function Footer() {
  const { t: st } = useSiteTexts();

  const sections = [
    {
      title: st("footer.sectionProducts", "Məhsullar"),
      links: [
        { href: "/products", label: st("footer.allListings", "Bütün elanlar") },
        { href: "/stores", label: st("footer.stores", "Mağazalar") },
        { href: "/products?category=heyvandarliq", label: st("footer.livestock", "Heyvandarlıq") },
        { href: "/products?category=texnika", label: st("footer.machinery", "Texnika") },
        { href: "/products?category=gubre", label: st("footer.fertilizer", "Gübrə & Kimya") },
      ],
    },
    {
      title: st("footer.sectionCompany", "Şirkət"),
      links: [
        { href: "/blog", label: st("footer.blog", "Bloq") },
        { href: "/leaderboard", label: st("footer.leaders", "Liderlər") },
        { href: "/agronom", label: st("footer.aiAgronomist", "AI Aqronom") },
        { href: "/elan-yerlesdir", label: st("footer.postAd", "Elan yerləşdir") },
        { href: "/register", label: st("footer.register", "Qeydiyyat") },
      ],
    },
    {
      title: st("footer.sectionSupport", "Dəstək"),
      links: [
        { href: "/dashboard", label: st("footer.myAccount", "Hesabım") },
        { href: "/messages", label: st("footer.messages", "Mesajlar") },
        { href: "/cart", label: st("footer.cart", "Səbət") },
        { href: "/login", label: st("footer.login", "Giriş") },
      ],
    },
  ];

  return (
    <footer className="mt-4 border-t border-gray-100 bg-gradient-to-br from-white via-gray-50/70 to-emerald-50/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 grid gap-8 md:grid-cols-[1.2fr,repeat(3,minmax(0,1fr))]">
          <div>
            <Link href="/" className="mb-3 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><Icon name="wheat" size={20} /></span>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                Fermer<span className="text-emerald-700"> Market</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-7 text-gray-600">
              {st("footer.aboutDescription", "Azərbaycanın kənd təsərrüfatı üçün premium rəqəmsal bazarı. Fermerlər, mağazalar və alıcıları bir platformada birləşdiririk.")}
            </p>

            {/* Sosial Media */}
            <div className="mt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">{st("footer.followUs", "Bizi izləyin")}</p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target={s.href !== "#" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 ${
                      s.href === "#"
                        ? "opacity-35 cursor-not-allowed"
                        : `${s.color} hover:scale-110 hover:shadow-md cursor-pointer`
                    }`}
                    onClick={s.href === "#" ? (e) => e.preventDefault() : undefined}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" dangerouslySetInnerHTML={{ __html: s.svg }} />
                  </a>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-gray-400 italic">{st("footer.moreLinksSoon", "Digər linklər tezliklə əlavə ediləcək")}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { label: st("footer.chipPremium", "Premium"), tone: "bg-emerald-50 text-emerald-700" },
                { label: st("footer.chipAiSupport", "AI dəstəyi"), tone: "bg-sky-50 text-sky-700" },
                { label: st("footer.chipMobileOptimization", "Mobil optimizasiya"), tone: "bg-amber-50 text-amber-700" },
              ].map((chip) => (
                <span key={chip.label} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${chip.tone}`}>
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          {sections.map((sec) => (
            <div key={sec.title}>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-gray-500">{sec.title}</h4>
              <ul className="space-y-2">
                {sec.links.map((l, idx) => (
                  <li key={l.href + idx}>
                    <Link href={l.href} className="text-sm text-gray-600 transition-colors hover:text-emerald-700">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row">
          {/* Bu 2 mətn qəsdən CMS-dən çıxarılıb və sərt kodlaşdırılıb — admin panelindən dəyişdirilə bilməz */}
          <p>© {new Date().getFullYear()} FermerMarket. Bütün hüquqlar qorunur.</p>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5">
            <Icon name="globe" size={16} className="text-gray-400" />
            <span>Developed By Gsmv</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
