import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initialTexts = [
  // Navigation
  { key: "nav.products", group: "navigation", label: "Navigasiya — Məhsullar", valueAz: "Məhsullar", valueEn: "Products", valueRu: "Товары" },
  { key: "nav.categories", group: "navigation", label: "Navigasiya — Kateqoriyalar", valueAz: "Kateqoriyalar", valueEn: "Categories", valueRu: "Категории" },
  { key: "nav.brands", group: "navigation", label: "Navigasiya — İstehsalçılar", valueAz: "İstehsalçılar", valueEn: "Brands", valueRu: "Производители" },
  { key: "nav.campaigns", group: "navigation", label: "Navigasiya — Kampaniyalar", valueAz: "Kampaniyalar", valueEn: "Campaigns", valueRu: "Кампании" },
  { key: "nav.stores", group: "navigation", label: "Navigasiya — Mağazalar", valueAz: "Mağazalar", valueEn: "Stores", valueRu: "Магазины" },
  { key: "nav.agronom", group: "navigation", label: "Navigasiya — AI Aqronom", valueAz: "AI Aqronom", valueEn: "AI Agronomist", valueRu: "AI Агроном" },
  { key: "nav.blog", group: "navigation", label: "Navigasiya — Bloq", valueAz: "Bloq", valueEn: "Blog", valueRu: "Блог" },
  { key: "nav.new_ad", group: "navigation", label: "Navigasiya — Yeni Elan Düyməsi", valueAz: "Yeni Elan", valueEn: "New Listing", valueRu: "Новое объявление" },
  { key: "nav.city", group: "navigation", label: "Navigasiya — Şəhər", valueAz: "Şəhər", valueEn: "City", valueRu: "Город" },
  { key: "nav.search_placeholder", group: "navigation", label: "Navigasiya — Axtarış placeholder", valueAz: "Məhsul, toxum, kimyəvi preparat və ya xəstəlik axtarın...", valueEn: "Search products, seeds, chemicals or diseases...", valueRu: "Поиск товаров, семян, химикатов или болезней..." },
  { key: "nav.home", group: "navigation", label: "Aşağı Navigasiya — Əsas", valueAz: "Əsas", valueEn: "Home", valueRu: "Главная" },
  { key: "nav.favorites", group: "navigation", label: "Aşağı Navigasiya — Seçilmiş", valueAz: "Seçilmiş", valueEn: "Favorites", valueRu: "Izbrannoe" },
  { key: "nav.messages", group: "navigation", label: "Aşağı Navigasiya — Mesajlar", valueAz: "Mesajlar", valueEn: "Messages", valueRu: "Сообщения" },
  { key: "nav.profile", group: "navigation", label: "Aşağı Navigasiya — Profil", valueAz: "Profil", valueEn: "Profile", valueRu: "Профиль" },
  { key: "nav.catalog", group: "navigation", label: "Aşağı Navigasiya — Kataloq", valueAz: "Kataloq", valueEn: "Catalog", valueRu: "Каталог" },
  { key: "nav.login", group: "navigation", label: "Aşağı Navigasiya — Giriş", valueAz: "Giriş", valueEn: "Login", valueRu: "Войти" },
  { key: "nav.sell", group: "navigation", label: "Aşağı Navigasiya — Sat düyməsi", valueAz: "Sat", valueEn: "Sell", valueRu: "Продать" },

  // Homepage
  { key: "home.hero.title", group: "homepage", label: "Ana Səhifə — Hero Başlıq", valueAz: "Sən də əkin, sat, qazan!", valueEn: "Plant, sell, earn!", valueRu: "Сажайте, продавайте, зарабатывайте!" },
  { key: "home.hero.subtitle", group: "homepage", label: "Ana Səhifə — Hero Alt Başlıq", valueAz: "Azərbaycanın ilk və ən böyük aqrar marketplace platforması", valueEn: "Azerbaijan's first and largest agricultural marketplace platform", valueRu: "Первая и крупнейшая аграрная маркетплейс платформа Азербайджана" },
  { key: "home.search.placeholder", group: "homepage", label: "Ana Səhifə — Hero Axtarış Placeholder", valueAz: "Nə axtarırsınız? (məs: Pomidor toxumu)", valueEn: "What are you looking for? (e.g. Tomato seeds)", valueRu: "Что вы ищете? (например: Семена томатов)" },
  { key: "home.search.button", group: "homepage", label: "Ana Səhifə — Hero Axtarış Düyməsi", valueAz: "Axtar", valueEn: "Search", valueRu: "Искать" },
  { key: "home.search.trending", group: "homepage", label: "Ana Səhifə — Trend Axtarışlar Başlığı", valueAz: "Trend Axtarışlar", valueEn: "Trending Searches", valueRu: "Популярные запросы" },
  { key: "home.stats.title", group: "homepage", label: "Ana Səhifə — Statistika Başlığı", valueAz: "Niyə FermerMarket?", valueEn: "Why FermerMarket?", valueRu: "Почему FermerMarket?" },
  { key: "home.stats.subtitle", group: "homepage", label: "Ana Səhifə — Statistika Alt Başlığı", valueAz: "Azərbaycanlı fermerlər bizi seçir", valueEn: "Azerbaijani farmers choose us", valueRu: "Азербайджанские фермеры выбирают нас" },
  { key: "home.stats.active_ads", group: "homepage", label: "Ana Səhifə — Statistika Aktiv Elan", valueAz: "Aktiv Elan", valueEn: "Active Ads", valueRu: "Активные объявления" },
  { key: "home.stats.farmers", group: "homepage", label: "Ana Səhifə — Statistika Fermer", valueAz: "Fermer", valueEn: "Farmers", valueRu: "Фермеры" },
  { key: "home.stats.stores", group: "homepage", label: "Ana Səhifə — Statistika Mağaza", valueAz: "Mağaza", valueEn: "Stores", valueRu: "Магазины" },
  { key: "home.stats.satisfied", group: "homepage", label: "Ana Səhifə — Statistika Məmnun İstifadəçi", valueAz: "Məmnun İstifadəçi", valueEn: "Satisfied Users", valueRu: "Довольные пользователи" },
  { key: "home.agronom.tag", group: "homepage", label: "Ana Səhifə — AI Aqronom Tag", valueAz: "AI ilə işləyir", valueEn: "Powered by AI", valueRu: "Работает на ИИ" },
  { key: "home.agronom.title", group: "homepage", label: "Ana Səhifə — AI Aqronom Başlıq", valueAz: "AI Aqronom", valueEn: "AI Agronomist", valueRu: "AI Агроном" },
  { key: "home.agronom.description", group: "homepage", label: "Ana Səhifə — AI Aqronom Təsviri", valueAz: "Bitkinizdə xəstəlik var? Şəkil göndərin, AI analiz etsin. Torpaq, məhsul, iqlim haqqında sual verin.", valueEn: "Has your plant got a disease? Send a photo for AI analysis.", valueRu: "Болезнь у растения? Отправьте фото для ИИ анализа." },
  { key: "home.agronom.btn_photo", group: "homepage", label: "Ana Səhifə — AI Aqronom Şəkil Düyməsi", valueAz: "Şəkil Göndər", valueEn: "Send Photo", valueRu: "Отправить фото" },
  { key: "home.agronom.btn_ask", group: "homepage", label: "Ana Səhifə — AI Aqronom Sual Düyməsi", valueAz: "Sual Ver", valueEn: "Ask Question", valueRu: "Задать вопрос" },
  { key: "home.categories.title", group: "homepage", label: "Ana Səhifə — Kateqoriyalar Bölməsi Başlığı", valueAz: "Kateqoriyalar", valueEn: "Categories", valueRu: "Категории" },
  { key: "home.premium.title", group: "homepage", label: "Ana Səhifə — Premium Elanlar Başlığı", valueAz: "Premium Elanlar", valueEn: "Premium Ads", valueRu: "Премиум объявления" },
  { key: "home.latest.title", group: "homepage", label: "Ana Səhifə — Yeni Elanlar Başlığı", valueAz: "Yeni Elanlar", valueEn: "New Listings", valueRu: "Новые объявления" },
  { key: "home.bundles.title", group: "homepage", label: "Ana Səhifə — Bağlamalar Başlığı", valueAz: "Bağlamalar", valueEn: "Bundles", valueRu: "Пакеты" },
  { key: "home.blog.title", group: "homepage", label: "Ana Səhifə — Bloq Bölməsi Başlığı", valueAz: "Fermer Məsləhətləri", valueEn: "Farmer Tips", valueRu: "Советы фермеру" },
  { key: "home.blog.subtitle", group: "homepage", label: "Ana Səhifə — Bloq Alt Başlıq", valueAz: "Kənd təsərrüfatı haqqında faydalı məqalələr", valueEn: "Useful articles about agriculture", valueRu: "Полезные статьи о сельском хозяйстве" },
  { key: "home.blog.read_more", group: "homepage", label: "Ana Səhifə — Bloq Hamısına Bax Düyməsi", valueAz: "Hamısı", valueEn: "View All", valueRu: "Все" },

  // Footer
  { key: "footer.about_title", group: "footer", label: "Footer — Haqqında Başlıq", valueAz: "FermerMarket haqqında", valueEn: "About FermerMarket", valueRu: "О FermerMarket" },
  { key: "footer.about_desc", group: "footer", label: "Footer — Haqqında Mətn", valueAz: "Azərbaycanın ilk və ən böyük aqrar marketplace platforması. Kənd təsərrüfatı məhsullarının onlayn satışı və alışı.", valueEn: "Azerbaijan's first agricultural marketplace.", valueRu: "Первый аграрный маркетплейс Азербайджана." },
  { key: "footer.col_products", group: "footer", label: "Footer — Məhsullar Sütun Başlığı", valueAz: "Məhsullar", valueEn: "Products", valueRu: "Товары" },
  { key: "footer.col_company", group: "footer", label: "Footer — Şirkət Sütun Başlığı", valueAz: "Şirkət", valueEn: "Company", valueRu: "Компания" },
  { key: "footer.col_contact", group: "footer", label: "Footer — Əlaqə Sütun Başlığı", valueAz: "Əlaqə", valueEn: "Contact", valueRu: "Контакты" },
  { key: "footer.copyright", group: "footer", label: "Footer — Müəllif Hüquqları Mətni", valueAz: "Bütün hüquqlar qorunur.", valueEn: "All rights reserved.", valueRu: "Все права защищены." },

  // Products Page
  { key: "products.page_title", group: "products", label: "Məhsullar Səhifəsi — Başlıq", valueAz: "Bütün Elanlar", valueEn: "All Listings", valueRu: "Все объявления" },
  { key: "products.search_results", group: "products", label: "Məhsullar Səhifəsi — Axtarış Nəticələri Mətni", valueAz: "üzrə axtarış nəticələri", valueEn: "search results for", valueRu: "результаты поиска по" },
  { key: "products.empty_title", group: "products", label: "Məhsullar Səhifəsi — Boş Nəticə Başlığı", valueAz: "Heç bir elan tapılmadı", valueEn: "No listings found", valueRu: "Объявления не найдены" },
  { key: "products.empty_desc", group: "products", label: "Məhsullar Səhifəsi — Boş Nəticə Təsviri", valueAz: "Axtarış parametrlərini dəyişərək yenidən cəhd edin.", valueEn: "Try changing your search parameters.", valueRu: "Попробуйте изменить параметры поиска." },
  { key: "products.filter_title", group: "products", label: "Məhsullar Səhifəsi — Filtr Başlığı", valueAz: "Filtrlər", valueEn: "Filters", valueRu: "Фильтры" },

  // Stores Page
  { key: "stores.page_title", group: "stores", label: "Mağazalar Səhifəsi — Başlıq", valueAz: "Rəsmi Mağazalar", valueEn: "Official Stores", valueRu: "Официальные магазины" },
  { key: "stores.subtitle", group: "stores", label: "Mağazalar Səhifəsi — Alt Başlıq", valueAz: "Kənd təsərrüfatı texnikası, toxum, gübrə və aqro-kimya mağazaları", valueEn: "Agricultural equipment, seed, fertilizer and agro-chemical stores", valueRu: "Магазины сельхозтехники, семян и удобрений" },

  // Blog Page
  { key: "blog.page_title", group: "blog", label: "Bloq Səhifəsi — Başlıq", valueAz: "Fermer Məsləhətləri və Aqro Bloq", valueEn: "Farmer Advice & Agro Blog", valueRu: "Советы фермеру и Агро блог" },
  { key: "blog.subtitle", group: "blog", label: "Bloq Səhifəsi — Alt Başlıq", valueAz: "Kənd təsərrüfatı, əkinçilik, heyvandarlıq və yeni texnologiyalar haqqında faydalı məqalələr", valueEn: "Useful articles about agriculture, farming and livestock", valueRu: "Полезные статьи о сельском хозяйстве и животноводстве" },
];

async function seed() {
  console.log("Seeding SiteText entries...");
  let count = 0;
  for (const item of initialTexts) {
    await prisma.siteText.upsert({
      where: { key: item.key },
      create: item,
      update: {
        label: item.label,
        group: item.group,
        valueAz: item.valueAz,
        valueEn: item.valueEn,
        valueRu: item.valueRu,
      },
    });
    count++;
  }
  console.log(`Successfully seeded ${count} SiteText entries!`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
