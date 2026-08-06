import { createNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { orderCreateSchema } from "@/lib/validators";

const PLATFORM_COMMISSION_RATE = 0.05; // 5% default — could be per-category/store later

// GET /api/orders?view=buying|selling|all
// buying (default) — orders the caller placed
// selling — orders that contain at least one of the caller's own products (FARMER/STORE)
// all — every order in the system (ADMIN/SUPER_ADMIN only)
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "buying";
  const status = searchParams.get("status");

  let where = { buyerId: authUser.sub };

  if (view === "selling") {
    where = { items: { some: { sellerId: authUser.sub } } };
  } else if (view === "delivering") {
    if (!["DELIVERY_PARTNER", "ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    where = { deliveryPartnerId: authUser.sub };
  } else if (view === "all") {
    if (!["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    where = {};
  }

  if (status) where = { ...where, status };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      items: { include: { product: { select: { titleAz: true, slug: true, images: { take: 1, select: { url: true } }, seller: { select: { fullName: true } } } } } },
      payment: true,
      coupon: { select: { code: true } },
      buyer: { select: { fullName: true, email: true, phone: true } },
    },
  });

  return Response.json({ orders });
}

// POST /api/orders — checkout: validates stock, locks price, computes commission/discount
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { items, couponCode, shippingAddress, shippingRegion, shippingCity, deliveryMethod } = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Load products, verify availability & lock server-side prices
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, status: "ACTIVE" },
      });

      if (products.length !== productIds.length) {
        throw new Error("STOCK:Bəzi məhsullar mövcud deyil və ya aktiv deyil");
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (product.stock < item.quantity) {
          throw new Error(`STOCK:"${product.titleAz}" üçün kifayət qədər stok yoxdur`);
        }
        // Korporativ minimum sifariş yoxlaması
        if (product.isCorporate && product.minOrderQty && item.quantity < product.minOrderQty) {
          throw new Error(`MINQTY:"${product.titleAz}" üçün minimum sifariş miqdarı ${product.minOrderQty} ədəddir`);
        }
      }

      // 2. Compute subtotal from server-side prices (never trust client price)
      const subtotal = items.reduce((sum, item) => {
        const product = productMap.get(item.productId);
        return sum + Number(product.price) * item.quantity;
      }, 0);

      // 3. Apply coupon if provided
      let discount = 0;
      let coupon = null;
      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon || !coupon.isActive) {
          throw new Error("COUPON:Kupon etibarsızdır");
        }
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new Error("COUPON:Kuponun müddəti bitib");
        }
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          throw new Error("COUPON:Kupon limiti dolub");
        }
        if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
          throw new Error(`COUPON:Minimum sifariş məbləği ${coupon.minOrderValue} AZN olmalıdır`);
        }
        discount =
          coupon.discountType === "PERCENTAGE"
            ? (subtotal * Number(coupon.discountValue)) / 100
            : Number(coupon.discountValue);
        discount = Math.min(discount, subtotal);
      }

      const commission = (subtotal - discount) * PLATFORM_COMMISSION_RATE;
      
      let deliveryCost = 0;
      if (deliveryMethod === "EXPRESS") deliveryCost = 10;
      else if (deliveryMethod === "STANDARD") deliveryCost = 5;

      const total = subtotal - discount + deliveryCost;

      // 4. Create order + items
      const newOrder = await tx.order.create({
        data: {
          buyerId: authUser.sub,
          subtotal,
          discount,
          commission,
          total,
          couponId: coupon?.id,
          shippingAddress,
          shippingRegion,
          shippingCity,
          deliveryMethod,
          deliveryCost,
          status: "PENDING",
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId);
              return {
                productId: item.productId,
                sellerId: product.sellerId || "guest",
                quantity: item.quantity,
                unitPrice: product.price,
                commissionRate: PLATFORM_COMMISSION_RATE,
              };
            }),
          },
        },
        include: { items: true },
      });

      // 5. Decrement stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 6. Increment coupon usage
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Auto-reward coins for purchasing products (Cashback)
      const earnedCoins = Math.floor(Number(total));
      if (earnedCoins > 0) {
        let wallet = await tx.wallet.findUnique({ where: { userId: authUser.sub } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId: authUser.sub, coins: 0, balance: 0 } });
        }
        if (wallet && wallet.id) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { coins: { increment: earnedCoins } }
          });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "EARNING",
              amount: earnedCoins,
              description: "Məhsul alışına görə keşbek",
              status: "COMPLETED"
            }
          });
        }
      }

      return newOrder;
    });

    // 7. Notify each unique seller about the new order
    const sellerIds = [...new Set(order.items.map(i => i.sellerId))];
    for (const sid of sellerIds) {
      if (!sid || sid === "guest") continue;
      createNotification({
        userId: sid,
        type: "order_update",
        title: "Yeni sifariş 🛒",
        body: `#${order.id.slice(-6).toUpperCase()} nömrəli yeni sifariş gəldi. Məbləğ: ₼${Number(order.total).toFixed(2)}`,
        link: "/dashboard",
      });
    }

    return Response.json({ order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    const [code, ...rest] = message.includes(":") ? message.split(":") : ["ERROR", message];
    const detail = rest.join(":");
    const statusMap = { STOCK: 409, MINQTY: 409, COUPON: 400, ERROR: 500 };
    return Response.json({ error: detail || message }, { status: statusMap[code] || 500 });
  }
}
