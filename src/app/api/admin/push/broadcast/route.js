import { getAuthUser, requireRole } from "@/lib/auth";
import { broadcastPush } from "@/lib/push";
import { z } from "zod";

const broadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  role: z
    .enum(["BUYER", "FARMER", "STORE", "AGRONOMIST", "DELIVERY_PARTNER", "MODERATOR", "ADMIN", "SUPER_ADMIN"])
    .optional(),
});

// POST /api/admin/push/broadcast — admin sends a web-push notification to
// all subscribed devices (optionally filtered to one role). Used for things
// like "yeni kampaniya elan et" or "sistem baxımı bildirişi".
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { title, body: message, url, role } = parsed.data;
  const result = await broadcastPush({ title, body: message, url: url || "/" }, { role });

  if (result.skipped) {
    return Response.json(
      { error: "Push bildirişləri konfiqurasiya edilməyib (VAPID açarları yoxdur)." },
      { status: 503 }
    );
  }

  return Response.json({ success: true, ...result });
}
