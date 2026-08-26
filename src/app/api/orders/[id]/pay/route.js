import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notifyOrderStatusChange } from "@/lib/email";

/**
 * POST /api/orders/:id/pay
 *
 * Creates a Payment record in PENDING state and returns a provider-ready
 * payload. This is intentionally provider-agnostic: plugging in a real
 * gateway (Stripe, Payriff, Kapital Bank, etc.) means implementing
 * `createProviderCharge()` below with that provider's SDK and secret key
 * from your own account — that credential cannot be fabricated here.
 *
 * Once the provider confirms payment (via redirect or webhook), the
 * webhook handler at /api/webhooks/payment marks this Payment SUCCEEDED
 * and flips the Order to PAID.
 */

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "manual";

async function createProviderCharge({ provider, amount, currency, orderId }) {
  if (provider === "manual") {
    // Manual/offline payment (bank transfer, cash on delivery) — no external call.
    return { providerRef: `manual_${orderId}`, redirectUrl: null, raw: { mode: "manual" } };
  }

  // Real integration point. Example shape for a card gateway:
  //
  // const res = await fetch("https://api.<provider>.com/v1/charges", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.PAYMENT_PROVIDER_SECRET_KEY}` },
  //   body: JSON.stringify({ amount, currency, metadata: { orderId } }),
  // });
  // const data = await res.json();
  // return { providerRef: data.id, redirectUrl: data.checkout_url, raw: data };
  //
  // process.env.PAYMENT_PROVIDER_SECRET_KEY must be supplied by you — it is
  // never something that can be generated on your behalf.
  throw new Error(
    `Payment provider "${provider}" is not yet wired up. Set PAYMENT_PROVIDER=manual for offline testing, or implement createProviderCharge() with your provider's SDK and secret key.`
  );
}

export async function POST(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { payment: true } });
  if (!order) return Response.json({ error: "Sifariş tapılmadı" }, { status: 404 });
  if (order.buyerId !== authUser.sub) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (order.payment) {
    return Response.json({ error: "Bu sifariş üçün ödəniş artıq başladılıb" }, { status: 409 });
  }
  if (order.status !== "PENDING") {
    return Response.json({ error: "Sifariş ödəniş üçün uyğun statusda deyil" }, { status: 409 });
  }

  let charge;
  try {
    charge = await createProviderCharge({
      provider: PAYMENT_PROVIDER,
      amount: order.total,
      currency: order.currency,
      orderId: order.id,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 501 });
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: PAYMENT_PROVIDER,
      providerRef: charge.providerRef,
      amount: order.total,
      currency: order.currency,
      status: PAYMENT_PROVIDER === "manual" ? "SUCCEEDED" : "PENDING",
      rawResponse: charge.raw,
    },
  });

  // Manual payments settle immediately (e.g. cash on delivery flow)
  if (PAYMENT_PROVIDER === "manual") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    notifyOrderStatusChange({
      to: authUser.email,
      orderId: order.id,
      orderNumber: order.id.slice(-8).toUpperCase(),
      status: "PAID",
    }).catch(() => {});
  }

  return Response.json({
    payment,
    redirectUrl: charge.redirectUrl,
    message:
      PAYMENT_PROVIDER === "manual"
        ? "Sifariş manual ödəniş rejimində təsdiqləndi."
        : "Ödəniş başladıldı, provayderin cavabını gözləyin.",
  });
}
