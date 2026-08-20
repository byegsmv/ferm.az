// Seed site texts for development
import { prisma } from './src/lib/prisma.js';

const SITE_TEXTS = [
  // Homepage
  { key: "home.hero.title", group: "homepage", label: "Hero Başlıq", valueAz: "Aqrar Bazar — Fermerlərdən birbaşa alıcıya!", valueEn: "Agricultural Market — Direct from farmers to buyers!", valueRu: "Аграрный рынок — Напрямую от фермеров покупателям!" },
  { key: "home.hero.subtitle", group: "homepage", label: "Hero Alt Başlıq", valueAz: "Mal-qara, gübrə, toxum, texnika və daha çoxu.", valueEn: "Livestock, fertilizer, seeds, machinery and more.", valueRu: "Скот, удобрения, семена, техника и многое другое." },
  { key: "home.hero.search", group: "homepage", label: "Hero Axtarış Placeholder", valueAz: "Nə axtarırsınız?", valueEn: "What are you looking for?", valueRu: "Что вы ищете?" },
  { key: "home.stats.farmers", group: "homepage", label: "Stat Fermerlər", valueAz: "Aktiv Fermer", valueEn: "Active Farmers", valueRu: "Активных фермеров" },
  { key: "home.stats.products", group: "homepage", label: "Stat Məhsullar", valueAz: "Məhsul", valueEn: "Products", valueRu: "Товаров" },
  { key: "home.stats.stores", group: "homepage", label: "Stat Mağazalar", valueAz: "Mağaza", valueEn: "Stores", valueRu: "Магазинов" },

  // Navigation
  { key: "nav.home", group: "navigation", label: "Ana Səhifə", valueAz: "Ana Səhifə", valueEn: "Home", valueRu: "Главная" },
  { key: "nav.products", group: "navigation", label: "Məhsullar", valueAz: "Məhsullar", valueEn: "Products", valueRu: "Товары" },
  { key: "nav.stores", group: "navigation", label: "Mağazalar", valueAz: "Mağazalar", valueEn: "Stores", valueRu: "Магазины" },
  { key: "nav.blog", group: "navigation", label: "Bloq", valueAz: "Bloq", valueEn: "Blog", valueRu: "Блог" },
  { key: "nav.contact", group: "navigation", label: "Əlaqə", valueAz: "Əlaqə", valueEn: "Contact", valueRu: "Контакт" },
  { key: "nav.login", group: "navigation", label: "Giriş", valueAz: "Giriş", valueEn: "Login", valueRu: "Войти" },
  { key: "nav.register", group: "navigation", label: "Qeydiyyat", valueAz: "Qeydiyyat", valueEn: "Register", valueRu: "Регистрация" },
  { key: "nav.dashboard", group: "navigation", label: "Panel", valueAz: "Panel", valueEn: "Dashboard", valueRu: "Панель" },

  // Products
  { key: "products.title", group: "products", label: "Məhsullar Səhifəsi Başlıq", valueAz: "Məhsullar", valueEn: "Products", valueRu: "Товары" },
  { key: "products.empty", group: "products", label: "Boş Məhsul Mesajı", valueAz: "Heç bir məhsul tapılmadı", valueEn: "No products found", valueRu: "Товары не найдены" },
  { key: "products.filter", group: "products", label: "Filter Başlıq", valueAz: "Filtrlər", valueEn: "Filters", valueRu: "Фильтры" },
  { key: "products.price", group: "products", label: "Qiymət", valueAz: "Qiymət", valueEn: "Price", valueRu: "Цена" },
  { key: "products.category", group: "products", label: "Kateqoriya", valueAz: "Kateqoriya", valueEn: "Category", valueRu: "Категория" },

  // Stores
  { key: "stores.title", group: "stores", label: "Mağazalar Səhifəsi Başlıq", valueAz: "Mağazalar", valueEn: "Stores", valueRu: "Магазины" },
  { key: "stores.empty", group: "stores", label: "Boş Mağaza Mesajı", valueAz: "Heç bir mağaza tapılmadı", valueEn: "No stores found", valueRu: "Магазины не найдены" },

  // Admin
  { key: "admin.title", group: "admin", label: "Admin Panel Başlıq", valueAz: "Admin Panel", valueEn: "Admin Panel", valueRu: "Панель администратора" },
  { key: "admin.dashboard", group: "admin", label: "Admin Dashboard", valueAz: "İdarə Paneli", valueEn: "Dashboard", valueRu: "Панель управления" },
  { key: "admin.tab.stats", group: "admin", label: "Tab Statistika", valueAz: "Statistika", valueEn: "Stats", valueRu: "Статистика" },
  { key: "admin.tab.orders", group: "admin", label: "Tab Sifarişlər", valueAz: "Sifarişlər", valueEn: "Orders", valueRu: "Заказы" },
  { key: "admin.tab.products", group: "admin", label: "Tab Məhsullar", valueAz: "Məhsullar", valueEn: "Products", valueRu: "Товары" },
  { key: "admin.tab.users", group: "admin", label: "Tab İstifadəçilər", valueAz: "İstifadəçilər", valueEn: "Users", valueRu: "Пользователи" },
  { key: "admin.tab.siteTexts", group: "admin", label: "Tab Məzmun İdarəsi", valueAz: "Məzmun İdarəsi", valueEn: "Content", valueRu: "Контент" },
  { key: "admin.tab.coupons", group: "admin", label: "Tab Kuponlar", valueAz: "Kuponlar", valueEn: "Coupons", valueRu: "Купоны" },

  // General
  { key: "general.save", group: "general", label: "Saxla Düyməsi", valueAz: "Saxla", valueEn: "Save", valueRu: "Сохранить" },
  { key: "general.cancel", group: "general", label: "Ləğv Et Düyməsi", valueAz: "Ləğv Et", valueEn: "Cancel", valueRu: "Отмена" },
  { key: "general.delete", group: "general", label: "Sil Düyməsi", valueAz: "Sil", valueEn: "Delete", valueRu: "Удалить" },
  { key: "general.edit", group: "general", label: "Redaktə Düyməsi", valueAz: "Redaktə", valueEn: "Edit", valueRu: "Редактировать" },
  { key: "general.loading", group: "general", label: "Yüklənir Mesajı", valueAz: "Yüklənir...", valueEn: "Loading...", valueRu: "Загрузка..." },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const st of SITE_TEXTS) {
    const existing = await prisma.siteText.findUnique({ where: { key: st.key } });
    if (existing) {
      console.log(`⏭️  Skip: ${st.key} (already exists)`);
      skipped++;
      continue;
    }

    await prisma.siteText.create({ data: st });
    console.log(`✅ Created: ${st.key}`);
    created++;
  }

  console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
