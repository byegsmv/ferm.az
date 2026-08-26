import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", pub, priv);
  configured = true;
  return true;
}

/**
 * Fire-and-forget web push sender. Never throws — a broken/missing push
 * config must never break the core order/product flow.
 */
export async function sendPushToUser(userId, payload) {
  if (!ensureConfigured()) {
    console.warn("[push] VAPID keys not configured — skipping push");
    return { skipped: true };
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return { skipped: true, reason: "no_subscriptions" };

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body
      )
    )
  );

  // Clean up subscriptions that are gone (410 Gone / 404 Not Found)
  const deadIds = [];
  results.forEach((r, i) => {
    if (r.status === "rejected" && [404, 410].includes(r.reason?.statusCode)) {
      deadIds.push(subs[i].id);
    }
  });
  if (deadIds.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: deadIds } } }).catch(() => {});
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length };
}

/**
 * Admin broadcast — sends a push notification to every subscribed device,
 * optionally filtered to a single role (e.g. only FARMER accounts). Used by
 * the admin panel's "Bildiriş Göndər" tool. Never throws.
 */
export async function broadcastPush(payload, { role } = {}) {
  if (!ensureConfigured()) {
    return { skipped: true, reason: "vapid_not_configured", sent: 0, total: 0 };
  }

  const subs = await prisma.pushSubscription.findMany({
    where: role ? { user: { role } } : {},
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (!subs.length) return { sent: 0, total: 0 };

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body)
    )
  );

  const deadIds = [];
  results.forEach((r, i) => {
    if (r.status === "rejected" && [404, 410].includes(r.reason?.statusCode)) {
      deadIds.push(subs[i].id);
    }
  });
  if (deadIds.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: deadIds } } }).catch(() => {});
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length, total: subs.length };
}
