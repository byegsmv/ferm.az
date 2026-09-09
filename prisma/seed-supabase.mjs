// FermerMarket — Supabase yeşid seed: kateqoriyalar, admin, mağaza, 12 məhsul
// İstifadə: DATABASE_URL=<supabase pooler> node prisma/seed-supabase.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

const CATEGORY_TREE = [
  { nameAz: "Bitki Mühafizə Vasitələri", nameEn: "Plant Protection", nameRu: "Средства защиты растений", icon: "bug",
    children: ["Herbisidlər","Fungisidlər","İnsektisidlər","Akarisidlər","Nematosidlər","Yapışdırıcılar (Adjuvant)","Dezinfeksiya vasitələri"] },
  { nameAz: "Gübrələr", nameEn: "Fertilizers", nameRu: "Удобрения", icon: "sprout",
    children: ["Maye gübrələr","Qranul gübrələr","Suda həll olan gübrələr","Yarpaq gübrələri","Damlama gübrələri","Üzvi gübrələr","Mikroelementlər","Amin turşuları","Humik/Fulvik turşular","Dəniz yosunu məhsulları"] },
  { nameAz: "Toxumlar", nameEn: "Seeds", nameRu: "Семена", icon: "leaf",
    children: ["Taxıl","Pambıq","Qarğıdalı","Yonca","Tərəvəz","Meyvə","Yem bitkiləri"] },
  { nameAz: "Tərkibinə görə", nameEn: "By Composition", nameRu: "По составу", icon: "droplet",
    children: ["Azot (N)","Fosfor (P)","Kalium (K)","Bor","Sink","Dəmir","Kalsium"] },
  { nameAz: "Texnika", nameEn: "Equipment", nameRu: "Техника", icon: "tractor",
    children: ["Traktorlar","Suvarma sistemləri","Sprayerlər","Əkin avadanlıqları","Yıxım texnikası"] },
  { nameAz: "Aqro Xidmətlər", nameEn: "Agro Services", nameRu: "Агроуслуги", icon: "grid",
    children: ["Aqronom xidməti","Suvarma xidməti","Zərərverici ilə mübarizə","Torpaq analizi","Əkin işləri"] },
  { nameAz: "Heyvandarlıq", nameEn: "Livestock", nameRu: "Животноводство", icon: "🐄",
    children: ["İnək","Buğa","Dana","Qoyun","Keçi","Camış","At"] },
  { nameAz: "Quşçuluq", nameEn: "Poultry", nameRu: "Птицеводство", icon: "🐔",
    children: ["Toyuq","Hind toyuğu","Ördək","Qaz"] },
  { nameAz: "Arıçılık", nameEn: "Beekeeping", nameRu: "Пчеловодство", icon: "🍯",
    children: ["Bal","Arı Ailəsi","Arıçılıq Avadanlığı"] },
  { nameAz: "Kampaniyalar", nameEn: "Campaigns", nameRu: "Кампании", icon: "tag",
    children: ["Endirimlər","Yeni məhsullar","Mövsümi təkliflər","Topdan satış","Rəsmi distribütor məhsulları"] },
];

async function main() {
  // ---------- KATEQORİYALAR ----------
  let sortOrder = 0;
  const catBySlug = {};
  for (const parent of CATEGORY_TREE) {
    const parentSlug = slugify(parent.nameAz, { lower: true, strict: true });
    const parentCat = await prisma.category.upsert({
      where: { slug: parentSlug },
      update: { nameAz: parent.nameAz, nameEn: parent.nameEn, nameRu: parent.nameRu },
      create: { slug: parentSlug, nameAz: parent.nameAz, nameEn: parent.nameEn, nameRu: parent.nameRu, icon: parent.icon, isActive: true, sortOrder: sortOrder++ },
    });
    catBySlug[parentSlug] = parentCat;
    for (const childName of parent.children) {
      const childSlug = slugify(`${parent.nameAz}-${childName}`, { lower: true, strict: true });
      const childCat = await prisma.category.upsert({
        where: { slug: childSlug },
        update: { nameAz: childName, parentId: parentCat.id },
        create: { slug: childSlug, nameAz: childName, nameEn: childName, nameRu: childName, parentId: parentCat.id, isActive: true, sortOrder: sortOrder++ },
      });
      catBySlug[childSlug] = childCat;
    }
  }
  console.log("Kateqoriyalar:", Object.keys(catBySlug).length);

  // ---------- ADMIN ----------
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "info@fermermarket.az" },
    update: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      email: "info@fermermarket.az",
      username: "elgun",
      passwordHash,
      fullName: "Elgün Gasimov",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      locale: "AZ",
      emailVerified: true,
    },
  });
  console.log("Admin:", admin.email);

  // ---------- MAĞAZA ----------
  const store = await prisma.store.upsert({
    where: { slug: "fermermarket-mmc" },
    update: { ownerId: admin.id, isActive: true, isVerified: true },
    create: {
      ownerId: admin.id,
      name: "FermerMarket MMC",
      slug: "fermermarket-mmc",
      description: "Kənd təsərrüfatı məhsulları — bitki mühafizə vasitələri, gübrələr və aqro xidmətlər. Rəsmi distribütor.",
      address: "Azərbaycan, Bakı",
      isVerified: true,
      isActive: true,
    },
  });
  console.log("Mağaza:", store.slug);

  // ---------- MƏHSULLAR ----------
  const bv = catBySlug["bitki-muhafize-vasiteleri"];
  const herb = catBySlug["bitki-muhafize-vasiteleri-herbisidler"];
  const fung = catBySlug["bitki-muhafize-vasiteleri-fungisidler"];
  const ins = catBySlug["bitki-muhafize-vasiteleri-insektisidler"];
  const fert = catBySlug["gubreler-maye-gubreler"];

  const PRODUCTS = [
    { titleAz: "Tarantula (1 Litr)", cat: ins, price: 0, corp: false, minQty: null, wPrice: null, wMin: null, desc: "İnsektisid. FermerMarket MMC rəsmi distribütor məhsulu." },
    { titleAz: "Morkap (5 Litr)", cat: herb, price: 0, corp: false, minQty: null, wPrice: null, wMin: null, desc: "Herbisid. FermerMarket MMC rəsmi distribütor məhsulu." },
    { titleAz: "Scout (500 Qram)", cat: herb, price: 0, corp: false, minQty: null, wPrice: null, wMin: null, desc: "Herbisid. FermerMarket MMC rəsmi distribütor məhsulu." },
    { titleAz: "Azoxris", cat: fung, price: 0, corp: false, minQty: null, wPrice: null, wMin: null, desc: "Fungisid. FermerMarket MMC rəsmi distribütor məhsulu." },
    { titleAz: "Evroxim KAS-32", cat: fert, price: 3.5, corp: true, minQty: null, wPrice: 2.8, wMin: 10, desc: "Maye azot gübrəsi (KAS-32). Topdan: 2.80 AZN (min 10 ədəd)." },
    { titleAz: "Selectra Plus", cat: bv, price: 0, corp: false, minQty: null, wPrice: null, wMin: null, desc: "Bitki mühafizə vasitəsi. FermerMarket MMC rəsmi distribütor məhsulu." },
    { titleAz: "Selectra Excellence", cat: bv, price: 0, corp: false, minQty: null, wPrice: null, wMin: null, desc: "Bitki mühafizə vasitəsi. FermerMarket MMC rəsmi distribütor məhsulu." },
    { titleAz: "SECCOZIN-10 (20 Litr)", cat: bv, price: 0, corp: true, minQty: 5, wPrice: null, wMin: 5, desc: "Bitki mühafizə vasitəsi. Topdan minimum 5 ədəd." },
    { titleAz: "GLADIO (20 Litr)", cat: ins, price: 116, corp: true, minQty: 5, wPrice: 106, wMin: 5, desc: "İnsektisid. Pərakəndə: 116 AZN, topdan: 106 AZN (min 5 ədəd)." },
    { titleAz: "PYRI-TOS (20 Litr)", cat: ins, price: 140, corp: true, minQty: 5, wPrice: 130, wMin: 5, desc: "İnsektisid. Pərakəndə: 140 AZN, topdan: 130 AZN (min 5 ədəd)." },
    { titleAz: "DELTA (20 Litr)", cat: ins, price: 170, corp: true, minQty: 5, wPrice: 160, wMin: 5, desc: "İnsektisid. Pərakəndə: 170 AZN, topdan: 160 AZN (min 5 ədəd)." },
    { titleAz: "HAWK 5 SG", cat: herb, price: 25, corp: true, minQty: 5, wPrice: 24, wMin: 5, desc: "Herbisid. Pərakəndə: 25 AZN, topdan: 24 AZN (min 5 ədəd)." },
  ];

  let count = 0;
  for (const p of PRODUCTS) {
    const slug = slugify(p.titleAz, { lower: true, strict: true });
    await prisma.product.upsert({
      where: { slug },
      update: { price: p.price, wholesalePrice: p.wPrice, wholesaleMinQty: p.wMin, titleAz: p.titleAz },
      create: {
        slug,
        titleAz: p.titleAz,
        titleEn: p.titleAz,
        titleRu: p.titleAz,
        descriptionAz: p.desc,
        descriptionEn: p.desc,
        descriptionRu: p.desc,
        price: p.price,
        currency: "AZN",
        stock: 100,
        status: "ACTIVE",
        categoryId: p.cat.id,
        sellerId: admin.id,
        storeId: store.id,
        unit: "ədəd",
        isCorporate: p.corp,
        minOrderQty: p.minQty,
        allowRetail: true,
        wholesalePrice: p.wPrice,
        wholesaleMinQty: p.wMin,
        packaging: p.titleAz.match(/\((.+)\)/)?.[1] || null,
      },
    });
    count++;
  }
  console.log("Məhsullar:", count);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
