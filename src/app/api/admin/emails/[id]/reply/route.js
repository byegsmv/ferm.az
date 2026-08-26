import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const { subject, body } = await request.json();

  if (!body) {
    return Response.json({ error: "Cavab mətni daxil edilməsidir" }, { status: 400 });
  }

  // Get the original email
  const originalEmail = await prisma.incomingEmail.findUnique({ where: { id } });
  if (!originalEmail) {
    return Response.json({ error: "E-poçt tapılmadı" }, { status: 404 });
  }

  // Build reply HTML
  const replySubject = subject || `Re: ${originalEmail.subject}`;
  const htmlBody = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
    <div style="background:linear-gradient(135deg,#16a34a,#166534);padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:20px">FermerMarket</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">
      <p>Salam ${originalEmail.fromName || originalEmail.fromEmail},</p>
      <div style="margin:16px 0;line-height:1.6">${body.replace(/\n/g, '<br>')}</div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#6b7280;font-size:13px">
        Bu e-poçt FermerMarket admin panelindən göndərilmişdir.<br>
        FermerMarket — <a href="https://fermermarket.az" style="color:#16a34a">fermermarket.az</a>
      </p>
    </div>
  </div>`;

  // Actually send the email via Resend
  const sendResult = await sendEmail({
    to: originalEmail.fromEmail,
    subject: replySubject,
    html: htmlBody,
  });

  if (sendResult?.error) {
    return Response.json({ error: "E-poçt göndərilə bilmədi: " + sendResult.error }, { status: 500 });
  }

  // Save reply to database
  const email = await prisma.incomingEmail.update({
    where: { id },
    data: {
      isReplied: true,
      replySubject,
      replyBody: body,
      replySentAt: new Date(),
    },
  });

  return Response.json({ success: true, message: "Cavab göndərildi", email });
}
