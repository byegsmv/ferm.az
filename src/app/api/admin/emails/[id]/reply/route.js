import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function POST(request, { params }) {
  const authUser = getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const { subject, body } = await request.json();

  if (!body) {
    return Response.json({ error: "Cavab mətni daxil edilməlidir" }, { status: 400 });
  }

  const email = await prisma.incomingEmail.update({
    where: { id },
    data: {
      isReplied: true,
      replySubject: subject || undefined,
      replyBody: body,
      replySentAt: new Date(),
    },
  });

  return Response.json({ success: true, message: "Cavab göndərildi", email });
}
