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
  couponCode: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  shippingRegion: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS", "PICKUP"]).default("STANDARD"),
  paymentMethod: z.string().default("CASH_ON_DELIVERY"),
  receiptUrl: z.string().optional().nullable(),
  transactionNote: z.string().optional().nullable(),
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
  nameAz: z.string().min(1, "Kateqoriya adı tələb olunur"),
  nameEn: z.string().optional().nullable().or(z.literal("")),
  nameRu: z.string().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable().or(z.literal("")),
  icon: z.string().optional().nullable().or(z.literal("")),
  parentId: z.string().optional().nullable().or(z.literal("")).transform(v => v || null),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const productRawSchema = z.object({
  titleAz: z.string().min(2, "Məhsul adı ən azı 2 simvol olmalıdır"),
  titleEn: z.string().optional().nullable().or(z.literal("")),
  titleRu: z.string().optional().nullable().or(z.literal("")),
  descriptionAz: z.string().optional().nullable().or(z.literal("")),
  descriptionEn: z.string().optional().nullable().or(z.literal("")),
  descriptionRu: z.string().optional().nullable().or(z.literal("")),
  price: z.number().positive("Qiymət müsbət olmalıdır"),
  currency: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().min(1, "Kateqoriya seçilməlidir"),
  storeId: z.string().optional().nullable().or(z.literal("")).transform(v => v || null),
  region: z.string().optional().nullable().or(z.literal("")),
  city: z.string().optional().nullable().or(z.literal("")),
  durationDays: z.number().int().optional().default(1),
  // Dynamic fields from form builder
  attributes: z.any().optional(),
  // Guest classified listing (no account)
  guestName: z.string().optional().nullable().or(z.literal("")),
  guestPhone: z.string().optional().nullable().or(z.literal("")),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        altText: z.string().optional().nullable().or(z.literal("")),
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
  brandId: z.string().optional().nullable().or(z.literal("")).transform(v => v || null),
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
  durationDays: z.number().int().optional().default(1),
});

export const productUpdateSchema = productRawSchema
  .partial()
  .extend({
    status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "SOLD", "EXPIRED", "REJECTED"]).optional(),
  });

export const brandCreateSchema = z.object({
  name: z.string().min(1, "Brend adı tələb olunur"),
  logoUrl: z.string().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const brandUpdateSchema = brandCreateSchema.partial();

export const storeCreateSchema = z.object({
  name: z.string().min(2, "Mağaza adı ən azı 2 simvol olmalıdır"),
  description: z.string().optional().nullable().or(z.literal("")),
  logoUrl: z.string().optional().nullable().or(z.literal("")),
  coverUrl: z.string().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  whatsapp: z.string().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable().or(z.literal("")),
  installmentEnabled: z.boolean().optional().default(false),
  installmentWhatsapp: z.string().optional().nullable().or(z.literal("")),
  email: z.string().optional().nullable().or(z.literal("")),
  facebook: z.string().optional().nullable().or(z.literal("")),
  instagram: z.string().optional().nullable().or(z.literal("")),
  tiktok: z.string().optional().nullable().or(z.literal("")),
  linkedin: z.string().optional().nullable().or(z.literal("")),
  youtube: z.string().optional().nullable().or(z.literal("")),
  telegram: z.string().optional().nullable().or(z.literal("")),
  workingHours: z.any().optional().nullable(),
  deliveryRegions: z.array(z.string()).optional(),
  taxInfo: z.string().optional().nullable().or(z.literal("")),
  bankName: z.string().optional().nullable().or(z.literal("")),
  bankAccount: z.string().optional().nullable().or(z.literal("")),
  iban: z.string().optional().nullable().or(z.literal("")),
  supportEmail: z.string().optional().nullable().or(z.literal("")),
  supportPhone: z.string().optional().nullable().or(z.literal("")),
  primaryColor: z.string().optional().nullable().or(z.literal("")),
  secondaryColor: z.string().optional().nullable().or(z.literal("")),
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
  description: z.string().optional().nullable().or(z.literal("")),
  storeId: z.string().optional().nullable().or(z.literal("")).transform(v => v || null),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  productIds: z.array(z.string().cuid()).min(2, "Bağlamada ən azı 2 məhsul olmalıdır"),
});

export const bundleUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional().nullable().or(z.literal("")),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().cuid()).min(2).optional(),
});

export const blogCreateSchema = z.object({
  titleAz: z.string().min(3),
  titleEn: z.string().optional().nullable().or(z.literal("")),
  titleRu: z.string().optional().nullable().or(z.literal("")),
  contentAz: z.string().min(10),
  contentEn: z.string().optional().nullable().or(z.literal("")),
  contentRu: z.string().optional().nullable().or(z.literal("")),
  coverUrl: z.string().optional().nullable().or(z.literal("")),
  category: z.string().optional().nullable().or(z.literal("")),
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
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});
