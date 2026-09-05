import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { productCreateSchema } from "@/lib/validators";
import { resolveCategorySlugs } from "@/lib/categoryFilter";
import slugify from "slugify";
import { extractAndSaveKeywords } from "@/lib/keywords";

// GET /api/products?category=&minPrice=&maxPrice=&region=&search=&page=&pageSize=&locale=
// GET /api/products?mine=1 (auth) — caller's own listings, any status
// GET /api/products?status=PENDING_REVIEW (admin/moderator only) — moderation queue across all sellers
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const mine = searchParams.get("mine") === "1";
    const corporateOnly = searchParams.get("corporate") === "1";
    const statusParam = searchParams.get("status");
    const excludeId = searchParams.get("excludeId");
    const locale = (searchParams.get("locale") || "az").toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    // Master Architecture Search Filters
    const ingredientId = searchParams.get("ingredientId");
    const diseaseId = searchParams.get("diseaseId");
    const pestId = searchParams.get("pestId");
    const cropId = searchParams.get("cropId");
    const manufacturer = searchParams.get("manufacturer");
    const preparativeForm = searchParams.get("preparativeForm");
    const inStock = searchParams.get("inStock") === "true";
    const isOrganic = searchParams.get("isOrganic") === "true";

    const authUser = await getAuthUser(request);
    const isAdminLevel = authUser && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);

    let statusFilter = { status: "ACTIVE" };
    let sellerFilter = {};

    if (mine) {
      if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
      sellerFilter = { sellerId: authUser.sub };
      statusFilter = statusParam ? { status: statusParam } : {};
    } else if (isAdminLevel) {
      // Admin/moderator can see any status (or filter by a specific one)
      statusFilter = statusParam ? { status: statusParam } : {};
    }

    const categorySlugs = await resolveCategorySlugs(categorySlug);

    const where = {
      ...statusFilter,
      ...sellerFilter,
      ...(region ? { region } : {}),
      ...(categorySlugs ? { category: { slug: { in: categorySlugs } } } : {}),
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...(corporateOnly ? { isCorporate: true } : {}),
      ...(ingredientId ? { activeIngredients: { some: { activeIngredientId: ingredientId } } } : {}),
      ...(diseaseId ? { diseases: { some: { diseaseId: diseaseId } } } : {}),
      ...(pestId ? { pests: { some: { pestId: pestId } } } : {}),
      ...(cropId ? { crops: { some: { cropId: cropId } } } : {}),
      ...(manufacturer ? { manufacturer: { contains: manufacturer, mode: "insensitive" } } : {}),
      ...(preparativeForm ? { preparativeForm } : {}),
      ...(inStock ? { stock: { gt: 0 } } : {}),
      ...(isOrganic ? { isOrganic: true } : {}),
      ...(minPrice || maxPrice
        ? {
          price: {
            ...(minPrice ? { gte: Number(minPrice) } : {}),
            ...(maxPrice ? { lte: Number(maxPrice) } : {}),
          },
        }
        : {}),
      ...(search
        ? {
          OR: [
            { titleAz: { contains: search, mode: "insensitive" } },
            { titleEn: { contains: search, mode: "insensitive" } },
            { titleRu: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
            { manufacturer: { contains: search, mode: "insensitive" } },
            {
              activeIngredients: {
                some: {
                  ingredient: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } }
                    ]
                  }
                }
              }
            },
            {
              diseases: {
                some: {
                  disease: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } }
                    ]
                  }
                }
              }
            },
            {
              pests: {
                some: {
                  pest: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } }
                    ]
                  }
                }
              }
            },
            {
              crops: {
                some: {
                  crop: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } }
                    ]
                  }
                }
              }
            },
            { tags: { hasSome: search.toLowerCase().split(/[\s,]+/).filter(w => w.length > 1) } }
          ],
        }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: (() => {
          const sortParam = searchParams.get("sort") || searchParams.get("sortBy");
          if (sortParam === "price_asc") return { price: "asc" };
          if (sortParam === "price_desc") return { price: "desc" };
          if (sortParam === "oldest") return { createdAt: "asc" };
          if (sortParam === "mostviewed" || sortParam === "most_viewed") return { viewCount: "desc" };
          if (sortParam === "bestselling" || sortParam === "best_selling") return { orderItems: { _count: "desc" } };
          return { createdAt: "desc" }; // default: newest
        })(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: { sortOrder: "asc" }, ...(mine ? {} : { take: 1 }) },
          category: { select: { slug: true, nameAz: true, nameEn: true, nameRu: true } },
          brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
          store: { select: { name: true, slug: true, isVerified: true } },
          seller: { select: { fullName: true, email: true, phone: true } },
          activeIngredients: { include: { ingredient: true } },
          crops: { include: { crop: true } },
          diseases: { include: { disease: true } },
          pests: { include: { pest: true } }
        },
      }),
    ]);

    if (search) {
      const action = items.length === 0 ? "SEARCH_NOT_FOUND" : "SEARCH_LOG";
      prisma.auditLog.create({
        data: {
          userId: authUser?.sub || null,
          action,
          entity: "Search",
          metadata: { query: search, resultsCount: items.length }
        }
      }).catch(() => { });
    }

    const localizeTitle = (p) =>
      locale === "en" ? p.titleEn || p.titleAz : locale === "ru" ? p.titleRu || p.titleAz : p.titleAz;

    const mapProduct = (p) => ({
      id: p.id,
      slug: p.slug,
      title: localizeTitle(p),
      price: p.price,
      discountedPrice: p.discountedPrice,
      currency: p.currency,
      region: p.region,
      city: p.city,
      stock: p.stock,
      status: p.status,
      coverImage: p.images?.[0]?.url || null,
      titleAz: p.titleAz,
      images: p.images?.map((img) => ({ url: img.url, altText: img.altText })),
      category: p.category ? { slug: p.category.slug, nameAz: p.category.nameAz, nameEn: p.category.nameEn, nameRu: p.category.nameRu } : null,
      brand: p.brand || null,
      store: p.store ? { name: p.store.name, slug: p.store.slug } : null,
      preparativeForm: p.preparativeForm,
      useNorm: p.useNorm,
      waterVolume: p.waterVolume,
      waitingPeriod: p.waitingPeriod,
      maxApplications: p.maxApplications,
      wholesalePrice: p.wholesalePrice,
      wholesaleMinQty: p.wholesaleMinQty,
      manufacturer: p.manufacturer,
      countryOfOrigin: p.countryOfOrigin,
      isOrganic: p.isOrganic,
      compareCount: p.compareCount,
      activeIngredients: p.activeIngredients?.map(ai => ({
        id: ai.ingredient.id,
        name: ai.ingredient.name,
        nameAz: ai.ingredient.nameAz,
        concentration: ai.concentration
      })) || [],
      crops: p.crops?.map(c => ({
        id: c.crop.id,
        name: c.crop.name,
        nameAz: c.crop.nameAz,
        slug: c.crop.slug
      })) || [],
      diseases: p.diseases?.map(d => ({
        id: d.disease.id,
        name: d.disease.name,
        nameAz: d.disease.nameAz,
        slug: d.disease.slug
      })) || [],
      pests: p.pests?.map(pest => ({
        id: pest.pest.id,
        name: pest.pest.name,
        nameAz: pest.pest.nameAz,
        slug: pest.pest.slug
      })) || [],
      seller:
        mine || isAdminLevel
          ? p.seller
            ? { fullName: p.seller.fullName, email: p.seller.email, phone: p.seller.phone || null }
            : { fullName: p.guestName || "Qonaq", email: null, guestPhone: p.guestPhone || null, isGuest: true }
          : undefined,
      isCorporate: p.isCorporate,
      allowRetail: p.allowRetail,
      unit: p.unit,
      tags: p.tags || [],
      minOrderQty: p.minOrderQty || null,
      createdAt: p.createdAt,
    });

    // Category fallback system
    if (items.length === 0 && categorySlug) {
      const mainCategory = await prisma.category.findUnique({ where: { slug: categorySlug }, select: { id: true } });
      if (mainCategory) {
        const categoryId = mainCategory.id;
        const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { parentId: true } });
        if (cat?.parentId) {
          const siblings = await prisma.category.findMany({ where: { parentId: cat.parentId }, select: { id: true } });
          const siblingIds = siblings.map(s => s.id);
          const products = await prisma.product.findMany({
            where: { status: 'ACTIVE', categoryId: { in: siblingIds } },
            orderBy: { createdAt: 'desc' },
            take: 12,
            include: {
              category: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              store: { select: { name: true, slug: true, isVerified: true } },
              seller: { select: { fullName: true, email: true, phone: true } }
            }
          });
          return Response.json({
            products: products.map(mapProduct),
            total: products.length,
            fallback: true,
            fallbackParentId: cat.parentId,
            pagination: {
              page: 1,
              pageSize: 12,
              total: products.length,
              totalPages: 1,
            }
          });
        }
      }
    }

    return Response.json({
      products: items.map(mapProduct),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("GET products error:", error);
    return Response.json({ error: "Məhsulları əldə edərkən daxili xəta baş verdi" }, { status: 500 });
  }
}

// POST /api/products
// - Logged-in FARMER/STORE/ADMIN/SUPER_ADMIN: normal listing tied to their account (existing behavior).
// - Anyone else (not logged in, or logged in as BUYER/AGRONOMIST/etc.): a "guest" classified
//   listing is allowed — no registration required — as long as guestName + guestPhone are
//   provided. Guest listings have no online order/wallet flow; buyers just call the phone number.
// In every case the listing starts as PENDING_REVIEW and only becomes publicly visible once
// an admin (or staff they've set up) approves it.
export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    const canPostAsSeller = !!authUser;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
    }

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { images, guestName, guestPhone, durationDays: rawDuration, ...data } = parsed.data;
    const durationDays = Number(rawDuration) || 1;

    // Fetch dynamic listing pricing
    let packagePrice = 0;
    try {
      const priceBlock = await prisma.dynamicBlock.findFirst({
        where: { key: "listing_pricing_config" },
      });
      const pricing = priceBlock?.props || {
        tier_1_day: { days: 1, price: 0 },
        tier_15_days: { days: 15, price: 7 },
        tier_30_days: { days: 30, price: 15 },
      };

      if (durationDays === 30) packagePrice = Number(pricing.tier_30_days?.price ?? 15);
      else if (durationDays === 15) packagePrice = Number(pricing.tier_15_days?.price ?? 7);
      else packagePrice = Number(pricing.tier_1_day?.price ?? 0);
    } catch {
      packagePrice = durationDays === 30 ? 15 : durationDays === 15 ? 7 : 0;
    }

    const isStaff = authUser && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);

    if (!isStaff && packagePrice > 0 && canPostAsSeller) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: authUser.sub } });
      if (!wallet || Number(wallet.balance) < packagePrice) {
        return Response.json(
          {
            error: `Balansınızda kifayət qədər vəsait yoxdur. Tələb olunan: ${packagePrice} ₼ (Balansınız: ${Number(wallet?.balance || 0).toFixed(2)} ₼). Zəhmət olmasa balansınızı artırın.`,
            needTopup: true,
            requiredAmount: packagePrice,
            currentBalance: Number(wallet?.balance || 0),
          },
          { status: 400 }
        );
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { userId: authUser.sub },
        data: { balance: { decrement: packagePrice } },
      });
    }

    if (!canPostAsSeller) {
      // Guest path — require contact info instead of an account.
      if (!guestName || !guestPhone) {
        return Response.json(
          {
            error: "Validasiya xətası",
            details: {
              guestName: !guestName ? ["Ad tələb olunur"] : undefined,
              guestPhone: !guestPhone ? ["Əlaqə nömrəsi tələb olunur"] : undefined,
            },
          },
          { status: 422 }
        );
      }
    }

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive) {
      return Response.json({ error: "Kateqoriya tapılmadı və ya deaktivdir" }, { status: 404 });
    }

    if (data.storeId) {
      const isStaff = authUser && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
      if (!isStaff) {
        const store = await prisma.store.findUnique({ where: { id: data.storeId } });
        if (!store || store.ownerId !== authUser?.sub) {
          return Response.json({ error: "Bu mağaza sizə məxsus deyil" }, { status: 403 });
        }
      }
    }

    const baseSlug = slugify(`${data.titleAz}-${Date.now().toString(36)}`, {
      lower: true,
      strict: true,
    });

    const product = await prisma.product.create({
      data: {
        ...data,
        slug: baseSlug,
        sellerId: canPostAsSeller ? authUser.sub : null,
        guestName: canPostAsSeller ? undefined : guestName,
        guestPhone: canPostAsSeller ? undefined : guestPhone,
        status: isStaff ? "ACTIVE" : "PENDING_REVIEW",
        images: images?.length
          ? {
            create: images.map((img, idx) => ({
              url: img.url,
              altText: img.altText,
              sortOrder: idx,
            })),
          }
          : undefined,
      },
      include: { images: true },
    });

    // Create listing duration record
    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const tier = durationDays >= 30 ? "PREMIUM" : durationDays >= 15 ? "FEATURED" : "STANDARD";

    await prisma.listing.upsert({
      where: { productId: product.id },
      create: {
        productId: product.id,
        tier,
        startDate,
        endDate,
      },
      update: {
        tier,
        startDate,
        endDate,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.sub ?? null,
        action: "PRODUCT_CREATED",
        entity: "Product",
        entityId: product.id,
        metadata: {
          guest: !canPostAsSeller,
          guestName,
          guestPhone,
          durationDays,
          packagePrice,
        },
      },
    });

    // Extract and save keywords for SEO
    await extractAndSaveKeywords({ ...product, category });

    return Response.json({ product, listing: { durationDays, endDate, tier } }, { status: 201 });
  } catch (error) {
    console.error("POST product error:", error);
    return Response.json({ error: "Məhsul yaradılarkən daxili xəta baş verdi" }, { status: 500 });
  }
}
