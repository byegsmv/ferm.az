import { prisma } from "@/lib/prisma";
import { notifyOrderStatusChange } from "@/lib/email";

/**
 * POST /api/webhooks/payment
 *
 * Generic webhook receiver. In production you MUST verify the request
 * signature using your provider's signing secret before trusting the
 * payload (e.g. Stripe's `stripe-signature` header + webhook secret).
 * That verification step is provider-specific and requires your own
 * webhook signing secret — left as an explicit integration point below.
 */
export async function POST(request) {
  // --- Signature verification placeholder --------------------------------
  // const signature = request.headers.get("x-provider-signature");
  // const rawBody = await request.text();
  // if (!verifySignature(rawBody, signature, process.env.PAYMENT_WEBHOOK_SECRET)) {
  //   return Response.json({ error: "Invalid signature" }, { status: 401 });
  // }
  // const event = JSON.parse(rawBody);
  // -------------------------------------------------------------------------

  let event;
  try {
    event = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { providerRef, status } = event; // expected shape from your provider, adapt as needed

  if (!providerRef || !status) {
    return Response.json({ error: "providerRef və status tələb olunur" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({ where: { providerRef } });
  if (!payment) {
    return Response.json({ error: "Ödəniş tapılmadı" }, { status: 404 });
  }

  const normalizedStatus = status === "succeeded" ? "SUCCEEDED" : status === "failed" ? "FAILED" : "PENDING";

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: normalizedStatus, rawResponse: event },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: normalizedStatus === "SUCCEEDED" ? "PAID" : "PENDING" },
    }),
  ]);

  if (normalizedStatus === "SUCCEEDED") {
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { buyer: { select: { email: true } } },
    });
    if (order) {
      notifyOrderStatusChange({
        to: order.buyer.email,
        orderId: order.id,
        orderNumber: order.id.slice(-8).toUpperCase(),
        status: "PAID",
      }).catch(() => {});
    }
  }

  return Response.json({ received: true });
}
