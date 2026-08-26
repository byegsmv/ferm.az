import { prisma } from "@/lib/prisma";

/**
 * Create an in-app notification for a user.
 * Silently swallows errors so it never breaks the main flow.
 */
export async function createNotification({ userId, type, title, body, link }) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link: link || null },
    });
  } catch (e) {
    console.error("createNotification failed:", e.message);
  }
}

/**
 * Bulk notify multiple users.
 */
export async function notifyMany(userIds, payload) {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, ...payload })),
    });
  } catch (e) {
    console.error("notifyMany failed:", e.message);
  }
}
