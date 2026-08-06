import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

const CATEGORY_TREE = [
  // 1. Bitki Mühafizə Vasitələri
  {
    nameAz: "Bitki Mühafizə Vasitələri", nameEn: "Plant Protection", nameRu: "Средства защиты растений", icon: "bug",
    children: [
      "Herbisidlər",
      "Fungisidlər",
      "İnsektisidlər",
      "Akarisidlər",
      "Nematosidlər",
      "Yapışdırıcılar (Adjuvant)",
      "Dezinfeksiya vasitələri",
    ],
  },
  // 2. Gübrələr
  {
    nameAz: "Gübrələr", nameEn: "Fertilizers", nameRu: "Удобрения", icon: "sprout",
    children: [
      "Maye gübrələr",
      "Qranul gübrələr",
      "Suda həll olan gübrələr",
      "Yarpaq gübrələri",
      "Damlama gübrələri",
      "Üzvi gübrələr",
      "Mikroelementlər",
      "Amin turşuları",
      "Humik/Fulvik turşular",
      "Dəniz yosunu məhsulları",
    ],
  },
  // 3. Toxumlar
  {
    nameAz: "Toxumlar", nameEn: "Seeds", nameRu: "Семена", icon: "leaf",
    children: [
      "Taxıl",
      "Pambıq",
      "Qarğıdalı",
      "Yonca",
      "Tərəvəz",
      "Meyvə",
      "Yem bitkiləri",
    ],
  },
  // 4. Tərkibinə görə
  {
    nameAz: "Tərkibinə görə", nameEn: "By Composition", nameRu: "По составу", icon: "droplet",
    children: [
      "Azot (N)",
      "Fosfor (P)",
      "Kalium (K)",
      "Bor",
      "Sink",
      "Dəmir",
      "Kalsium",
      "Maqnezium",
      "Manqan",
      "Mis",
      "Molibden",
    ],
  },
  // 5. Texnika
  {
    nameAz: "Texnika", nameEn: "Equipment", nameRu: "Техника", icon: "tractor",
    children: [
      "Çiləyicilər",
      "Dronlar",
      "Gübrəsəpənlər",
      "Traktor avadanlıqları",
      "Suvarma sistemləri",
    ],
  },
  // 6. Aqro xidmətlər
  {
    nameAz: "Aqro Xidmətlər", nameEn: "Agro Services", nameRu: "Агроуслуги", icon: "grid",
    children: [
      "AI Aqronom",
      "Torpaq analizi",
      "Yarpaq analizi",
      "Aqronom konsultasiyası",
    ],
  },
  // 7. Canlı heyvan (mövcud kategoriya saxlanılır)
  {
    nameAz: "Heyvandarlıq", nameEn: "Livestock", nameRu: "Животноводство", icon: "🐄",
    children: ["İnək", "Buğa", "Dana", "Qoyun", "Keçi", "Camış", "At"],
  },
  // 8. Quşçuluq
  {
    nameAz: "Quşçuluq", nameEn: "Poultry", nameRu: "Птицеводство", icon: "🐔",
    children: ["Toyuq", "Hind toyuğu", "Ördək", "Qaz"],
  },
  // 9. Arıçılıq
  {
    nameAz: "Arıçılıq", nameEn: "Beekeeping", nameRu: "Пчеловодство", icon: "🍯",
    children: ["Bal", "Arı Ailəsi", "Arıçılıq Avadanlığı"],
  },
  // 10. Kampaniyalar (virtual kateqoriya — kampaniyalar səhifəsi ilə əlaqəli)
  {
    nameAz: "Kampaniyalar", nameEn: "Campaigns", nameRu: "Кампании", icon: "tag",
    children: [
      "Endirimlər",
      "Yeni məhsullar",
      "Mövsümi təkliflər",
      "Topdan satış",
      "Rəsmi distribütor məhsulları",
    ],
  },
];

async function hash(p) {
  return bcrypt.hash(p, 10);
}

async function main() {
  // ---------- CATEGORIES ----------
  let sortOrder = 0;
  const childCategoryIds = [];
  for (const parent of CATEGORY_TREE) {
    const parentSlug = slugify(parent.nameAz, { lower: true, strict: true });
    const parentCategory = await prisma.category.upsert({
      where: { slug: parentSlug },
      update: {
        nameEn: parent.nameEn,
        nameRu: parent.nameRu,
        icon: parent.icon,
      },
      create: {
        slug: parentSlug,
        nameAz: parent.nameAz,
        nameEn: parent.nameEn,
        nameRu: parent.nameRu,
        icon: parent.icon,
        sortOrder: sortOrder++,
      },
    });

    let childOrder = 0;
    for (const childName of parent.children) {
      const childSlug = slugify(`${parent.nameAz}-${childName}`, { lower: true, strict: true });
      const child = await prisma.category.upsert({
        where: { slug: childSlug },
        update: { nameAz: childName, parentId: parentCategory.id },
        create: {
          slug: childSlug,
          nameAz: childName,
          parentId: parentCategory.id,
          sortOrder: childOrder++,
        },
      });
      childCategoryIds.push(child);
    }
  }
  console.log("✅ Kateqoriyalar uğurla yükləndi (" + CATEGORY_TREE.length + " əsas, " + 
    CATEGORY_TREE.reduce((sum, c) => sum + c.children.length, 0) + " alt kateqoriya).");

  // ---------- DEMO USERS ----------
  const demoUsers = [
    { email: "admin@fermermarket.az", role: "SUPER_ADMIN", fullName: "Super Admin", password: "Admin123!" },
    { email: "farmer@fermermarket.az", role: "FARMER", fullName: "Rəşad Fermer", password: "Farmer123!" },
    { email: "store@fermermarket.az", role: "STORE", fullName: "Aqro Market MMC", password: "Store123!" },
    { email: "agronomist@fermermarket.az", role: "AGRONOMIST", fullName: "Dr. Aqronom Vəliyev", password: "Agro123!" },
    { email: "buyer@fermermarket.az", role: "BUYER", fullName: "Elnur Alıcı", password: "Buyer123!" },
  ];

  const users = {};
  for (const u of demoUsers) {
    const passwordHash = await hash(u.password);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        passwordHash,
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    users[u.role] = user;
  }
  console.log("✅ Demo istifadəçilər hazırlandı");

  // ---------- DEMO STORE ----------
  const store = await prisma.store.upsert({
    where: { slug: "aqro-market" },
    update: {},
    create: {
      ownerId: users.STORE.id,
      name: "Aqro Market MMC",
      slug: "aqro-market",
      description: "Kənd təsərrüfatı məhsulları və avadanlıqları üzrə ixtisaslaşmış mağaza.",
      isVerified: true,
      isActive: true,
      whatsapp: "994501234567",
      phone: "+994501234567",
      address: "Bakı, Azərbaycan",
    },
  });

  // ---------- DEMO PRODUCTS ----------
  const findCat = (name) => childCategoryIds.find((c) => c.nameAz === name);

  const demoProducts = [
    // Bitki Mühafizə
    { title: "Herbisid Roundup 5L", cat: "Herbisidlər", price: 85, stock: 50, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Tam spektrli herbisid, alaqlara qarşı effektivdir.", manufacturer: "Bayer", preparativeForm: "SL", useNorm: "2-4 L/ha" },
    { title: "Fungisid Topas 1L", cat: "Fungisidlər", price: 45, stock: 80, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Sistemli fungisid, göbələk xəstəliklərinə qarşı.", manufacturer: "Syngenta", preparativeForm: "EC", useNorm: "0.4-0.5 L/ha" },
    { title: "İnsektisid KaratZeon 250ml", cat: "İnsektisidlər", price: 28, stock: 120, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Geniş spektrli insektisid.", manufacturer: "Syngenta", preparativeForm: "EC", useNorm: "200-300 ml/ha" },
    // Gübrələr
    { title: "Maye Gübrə NPK 10L", cat: "Maye gübrələr", price: 35, stock: 200, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Kompleks maye gübrə, NPK 20-20-20.", manufacturer: "Yara", useNorm: "5-10 L/ha" },
    { title: "Üzvi Gübrə BioHumus 20kg", cat: "Üzvi gübrələr", price: 18, stock: 150, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Təbii üzvi gübrə, torpağın strukturunu yaxşılaşdırır.", manufacturer: "BioOrganic" },
    { title: "Humik Turşu 1L", cat: "Humik/Fulvik turşular", price: 22, stock: 100, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Humik və fulvik turşu məhlulu.", manufacturer: "Valagro" },
    { title: "Mikroelement Mix 1kg", cat: "Mikroelementlər", price: 30, stock: 90, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "7 mikroelementli qarışıq (B, Zn, Fe, Mn, Cu, Mo, Mg).", manufacturer: "EuroChem" },
    // Toxumlar
    { title: "Taxıl Toxumu Sertifikatlı 50kg", cat: "Taxıl", price: 120, stock: 300, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Yüksək məhsuldar taxıl toxumu, sertifikatlı." },
    { title: "Tərəvəz Toxumu Seti (10 növ)", cat: "Tərəvəz", price: 15, stock: 500, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "10 növ tərəvəz toxumu dəsti." },
    // Tərkibinə görə
    { title: "Azot Gübrəsi 50kg (N 46%)", cat: "Azot (N)", price: 45, stock: 120, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Karbamid, 46% azot tərkibi.", manufacturer: "EuroChem", useNorm: "100-200 kg/ha" },
    { title: "Kalium Sulfat 25kg (K 50%)", cat: "Kalium (K)", price: 55, stock: 80, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Kalium sulfat gübrəsi.", manufacturer: "ICL", useNorm: "50-150 kg/ha" },
    // Texnika
    { title: "Mini Traktor 25HP", cat: "Traktor avadanlıqları", price: 18500, stock: 2, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "25 at gücündə mini traktor." },
    { title: "Damcı Suvarma Sistemi (1ha)", cat: "Suvarma sistemləri", price: 950, stock: 8, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "Tam dəst damcı suvarma sistemi." },
    { title: "Aqro Dron 16L", cat: "Dronlar", price: 12000, stock: 1, seller: users.STORE, storeId: store.id, region: "Bakı", desc: "16L çiləyici dron, GPS idarəolunma." },
    // Heyvandarlıq
    { title: "Sağmal Dana İnək", cat: "İnək", price: 2200, stock: 3, seller: users.FARMER, region: "Gəncə", desc: "3 yaşlı, gündə 18L süd verən sağlam holştin inək." },
    { title: "Qoyun (Canlı Çəki)", cat: "Qoyun", price: 380, stock: 15, seller: users.FARMER, region: "Şəki", desc: "Qurban bayramı üçün uyğun, sağlam və kök qoyunlar." },
    // Arıçılıq
    { title: "Təbii Bal 1kg", cat: "Bal", price: 25, stock: 60, seller: users.FARMER, region: "Quba", desc: "Dağ florasından toplanmış, süzülmüş təbii bal." },
  ];

  for (const p of demoProducts) {
    const category = findCat(p.cat);
    if (!category) {
      console.log("⚠️ Kateqoriya tapılmadı:", p.cat);
      continue;
    }
    const slug = slugify(p.title, { lower: true, strict: true }) + "-" + Date.now().toString().slice(-4);
    const product = await prisma.product.create({
      data: {
        slug,
        titleAz: p.title,
        titleEn: p.title,
        titleRu: p.title,
        descriptionAz: p.desc,
        price: p.price,
        stock: p.stock,
        status: "ACTIVE",
        categoryId: category.id,
        sellerId: p.seller.id,
        storeId: p.storeId || null,
        region: p.region,
        manufacturer: p.manufacturer || null,
        preparativeForm: p.preparativeForm || null,
        useNorm: p.useNorm || null,
        publishedAt: new Date(),
      },
    });
  }
  console.log("✅ Demo məhsullar əlavə edildi (" + demoProducts.length + " məhsul).");

  // ---------- DEMO CAMPAIGN ----------
  const campaignCat = childCategoryIds.find(c => c.nameAz === "Endirimlər");
  if (campaignCat) {
    await prisma.campaign.create({
      data: {
        title: "Yaz Mövsümü Endirimləri",
        type: "DISCOUNT",
        status: "ACTIVE",
        discountValue: 15,
        discountType: "PERCENTAGE",
        targetCategoryId: campaignCat.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        placement: "HOMEPAGE_TOP",
      },
    }).catch(() => {});
    console.log("✅ Demo kampaniya yaradıldı");
  }

  console.log("\n🎉 Seed tamamlandı!");
  console.log("📧 Test hesablar: admin@fermermarket.az / Admin123!");
}

main()
  .catch((e) => {
    console.error("Seed xətası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
