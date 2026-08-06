import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { pushSubscribeSchema } from "@/lib/validators";
import { z } from "zod";

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = pushSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { endpoint, keys } = parsed.data;

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: authUser.sub, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: authUser.sub, p256dh: keys.p256dh, auth: keys.auth },
  });

  return Response.json({ subscription: { id: sub.id } }, { status: 201 });
}

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

export async function DELETE(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "endpoint tələb olunur" }, { status: 422 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, userId: authUser.sub } });
  return Response.json({ success: true });
}
