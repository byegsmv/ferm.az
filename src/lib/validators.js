import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Düzgün e-poçt daxil edin").optional().or(z.literal("")),
  username: z.string().min(3, "İstifadəçi adı ən azı 3 simvol olmalıdır").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Şifrə ən azı 8 simvol olmalıdır")
  ,
  fullName: z.string().min(2, "Ad Soyad tələb olunur"),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["BUYER"]).default("BUYER").optional(),
  locale: z.enum(["AZ", "EN", "RU"]).default("AZ"),
}).refine((data) => data.email || data.phone || data.username, {
  message: "E-poçt, telefon və ya istifadəçi adı daxil edilməlidir",
  path: ["email"],
});

export const loginSchema = z.object({
  login: z.string().min(1, "Giriş məlumatı (E-poçt, telefon və ya istifadəçi adı) tələb olunur"),
  password: z.string().min(1, "Şifrə tələb olunur"),
});

export const orderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Sifarişdə ən azı 1 məhsul olmalıdır"),
  couponCode: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingRegion: z.string().optional(),
  shippingCity: z.string().optional(),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS", "PICKUP"]).default("STANDARD"),
});

export const couponCreateSchema = z.object({
  code: z.string().min(3).max(30),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(0).max(100),
  minOrderValue: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  startsAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)).optional(),
  expiresAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.startsAt && data.expiresAt) {
    const start = new Date(data.startsAt);
    const end = new Date(data.expiresAt);
    if (end <= start) {
      return { valid: false, error: { path: ["expiresAt"], message: "Bitmə tarixi başlanğıc tarixindən sonra olmalıdır" } };
    }
  }
  return { valid: true };
}, { message: "Bitmə tarixi başlanğıc tarixindən sonra olmalıdır", path: ["expiresAt"] });

export const couponUpdateSchema = z.object({
  code: z.string().min(3).max(30).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).max(100).optional(),
  minOrderValue: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)).nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  const start = data.startsAt ? (data.startsAt === null ? null : new Date(data.startsAt)) : undefined;
  const end = data.expiresAt ? (data.expiresAt === null ? null : new Date(data.expiresAt)) : undefined;
  if (start !== undefined && end !== undefined && start !== null && end !== null) {
    if (end <= start) {
      return { valid: false, error: { path: ["expiresAt"], message: "Bitmə tarixi başlanğıc tarixindən sonra olmalıdır" } };
    }
  }
  return { valid: true };
}, { message: "Bitmə tarixi başlanğıc tarixindən sonra olmalıdır", path: ["expiresAt"] });

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  orderSubtotal: z.number().positive(),
});

export const listingUpsertSchema = z.object({
  productId: z.string().cuid(),
  tier: z.enum(["STANDARD", "FEATURED", "PREMIUM", "VIP"]),
  endDate: z.string().datetime().optional().nullable(),
  autoRenew: z.boolean().optional(),
});

export const campaignCreateSchema = z
  .object({
    title: z.string().min(3),
    type: z.enum([
      "HOMEPAGE_BANNER",
      "CATEGORY_BANNER",
      "STORE_PROMOTION",
      "FLASH_SALE",
      "DAILY_DEAL",
      "SPONSORED_PRODUCT",
      "REGIONAL",
    ]),
    bannerUrl: z.string().url().optional(),
    targetUrl: z.string().url().optional(),
    storeId: z.string().cuid().optional().nullable(),
    categoryId: z.string().cuid().optional().nullable(),
    region: z.string().optional(),
    startDate: z.string().min(8),
    endDate: z.string().min(8),
    budget: z.number().positive().optional(),
    costPerClick: z.number().positive().optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "Bitmə tarixi başlanğıc tarixindən sonra olmalıdır",
    path: ["endDate"],
  });

export const campaignUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "EXPIRED"]).optional(),
  bannerUrl: z.string().url().optional().nullable(),
  targetUrl: z.string().url().optional().nullable(),
  storeId: z.string().cuid().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  region: z.string().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  costPerClick: z.number().positive().optional(),
});

export const passwordResetRequestSchema = z.object({
  identifier: z.string().min(3, "E-poçt, telefon və ya istifadəçi adı daxil edin"),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10),
  newPassword: z
    .string()
    .min(6, "Şifrə ən azı 6 simvol olmalıdır")
    .regex(/[0-9]/, "Şifrədə ən azı bir rəqəm olmalıdır"),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  locale: z.enum(["AZ", "EN", "RU"]).optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z
    .enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "FARMER", "STORE", "AGRONOMIST", "BUYER", "DELIVERY_PARTNER"])
    .optional(),
  status: z.enum(["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "BANNED"]).optional(),
  isBanned: z.boolean().optional(),
  fullName: z.string().min(2, "Ad ən azı 2 simvol olmalıdır").optional(),
  email: z.string().email("Düzgün email daxil edin").optional(),
  phone: z.string().optional().nullable(),
  username: z.string().min(2, "İstifadəçi adı ən azı 2 simvol olmalıdır").optional().nullable(),
  newPassword: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır").optional(),
});

export const categoryCreateSchema = z.object({
  nameAz: z.string().min(2),
  nameEn: z.string().optional(),
  nameRu: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const productRawSchema = z.object({
  titleAz: z.string().min(3),
  titleEn: z.string().optional(),
  titleRu: z.string().optional(),
  descriptionAz: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionRu: z.string().optional(),
  price: z.number().positive("Qiymət müsbət olmalıdır"),
  currency: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().min(1),
  storeId: z.string().min(1).optional().nullable(),
  region: z.string().optional(),
  city: z.string().optional(),
  // Dynamic fields from form builder
  attributes: z.any().optional(),
  // Guest classified listing (no account) — required only when posting without login.
  guestName: z.string().min(2, "Ad tələb olunur").optional(),
  guestPhone: z
    .string()
    .regex(/^[+0-9][0-9\s-]{6,14}$/, "Düzgün telefon nömrəsi daxil edin")
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        altText: z.string().optional(),
      })
    )
    .optional(),
  isCorporate: z.boolean().optional(),
  minOrderQty: z.number().int().positive().optional().nullable(),
  allowRetail: z.boolean().optional(),
  unit: z.string().optional(),
  wholesalePrice: z.number().positive().optional().nullable(),
  wholesaleMinQty: z.number().int().positive().optional().nullable(),
  discountedPrice: z.number().positive().optional().nullable(),
  brandId: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  allowInstallment: z.boolean().optional(),
});

export const productCreateSchema = productRawSchema.extend({
  currency: z.string().default("AZN"),
  stock: z.number().int().nonnegative().default(1),
  isCorporate: z.boolean().default(false),
  allowRetail: z.boolean().default(true),
  unit: z.string().default("ədəd"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  allowInstallment: z.boolean().optional().default(false),
});

export const productUpdateSchema = productRawSchema
  .partial()
  .extend({
    status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "SOLD", "EXPIRED", "REJECTED"]).optional(),
  });

export const brandCreateSchema = z.object({
  name: z.string().min(2, "Brend adı ən azı 2 simvol olmalıdır"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const brandUpdateSchema = brandCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const storeCreateSchema = z.object({
  name: z.string().min(2, "Mağaza adı ən azı 2 simvol olmalıdır"),
  description: z.string().optional(),
  logoUrl: z.string().url().or(z.literal("")).optional().nullable(),
  coverUrl: z.string().url().or(z.literal("")).optional().nullable(),
  address: z.string().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().or(z.literal("")).optional().nullable(),
  installmentEnabled: z.boolean().optional().default(false),
  installmentWhatsapp: z.string().optional().nullable(),
  email: z.string().email().or(z.literal("")).optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  workingHours: z.any().optional().nullable(),
  deliveryRegions: z.array(z.string()).optional(),
  taxInfo: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  supportEmail: z.string().email().or(z.literal("")).optional().nullable(),
  supportPhone: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  themeMode: z.enum(["light", "dark"]).optional(),
  followerCount: z.number().int().optional().default(0),
  storeViewCount: z.number().int().optional().default(0),
  totalSales: z.number().int().optional().default(0),
});

export const storeUpdateSchema = storeCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});


export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1, "Reytinq 1-5 arası olmalıdır").max(5, "Reytinq 1-5 arası olmalıdır"),
  comment: z.string().max(2000).optional(),
});

// ---------- Phase 6: Wallet, Bundles, Blog, Messaging, Push ----------

export const walletWithdrawSchema = z.object({
  amount: z.number().positive("Məbləğ müsbət olmalıdır"),
  note: z.string().max(500).optional(),
});

export const bundleCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  storeId: z.string().cuid().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  productIds: z.array(z.string().cuid()).min(2, "Bağlamada ən azı 2 məhsul olmalıdır"),
});

export const bundleUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().cuid()).min(2).optional(),
});

export const blogCreateSchema = z.object({
  titleAz: z.string().min(3),
  titleEn: z.string().optional(),
  titleRu: z.string().optional(),
  contentAz: z.string().min(10),
  contentEn: z.string().optional(),
  contentRu: z.string().optional(),
  coverUrl: z.string().url().optional().nullable(),
  category: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const blogUpdateSchema = blogCreateSchema.partial();

export const messageCreateSchema = z.object({
  sellerId: z.string().cuid().optional(),
  buyerId: z.string().cuid().optional(),
  productId: z.string().cuid().optional().nullable(),
  content: z.string().min(1).max(3000),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});
