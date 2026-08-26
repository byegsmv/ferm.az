import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "FermerMarket <onboarding@resend.dev>";

/**
 * Fire-and-forget transactional email sender.
 * Never throws — a broken/missing email provider must NEVER break the
 * core order/product flow. Failures are logged to the server console only.
 */
export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return { skipped: true };
  }
  if (!to) return { skipped: true };

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    return result;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { error: err.message };
  }
}

function wrapper(bodyHtml) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
    <div style="background:linear-gradient(135deg,#16a34a,#166534);padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:20px">FermerMarket</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">
      ${bodyHtml}
    </div>
    <p style="color:#9ca3af;font-size:12px;margin-top:16px">Bu, FermerMarket tərəfindən avtomatik göndərilən bildirişdir.</p>
  </div>`;
}

const ORDER_STATUS_LABELS_AZ = {
  PENDING: "Gözləyir",
  PAID: "Ödənilib",
  PROCESSING: "Hazırlanır",
  SHIPPED: "Göndərilib",
  DELIVERED: "Çatdırılıb",
  CANCELLED: "Ləğv edilib",
  REFUNDED: "Geri qaytarılıb",
};

export async function notifyOrderStatusChange({ to, orderId, status, orderNumber }) {
  const label = ORDER_STATUS_LABELS_AZ[status] || status;
  const ref = orderNumber || orderId;
  return sendEmail({
    to,
    subject: `Sifariş #${ref} — status: ${label}`,
    html: wrapper(`
      <p>Salam,</p>
      <p>Sifariş <strong>#${ref}</strong> statusu dəyişdi:</p>
      <p style="font-size:18px;font-weight:bold;color:#166534">${label}</p>
      <p>Sifarişinizin təfərrüatlarını hesabınızdan yoxlaya bilərsiniz.</p>
    `),
  });
}

export async function notifyProductReviewed({ to, productTitle, approved, reason }) {
  return sendEmail({
    to,
    subject: approved ? `Elanınız təsdiqləndi: ${productTitle}` : `Elanınız rədd edildi: ${productTitle}`,
    html: wrapper(
      approved
        ? `<p>Salam,</p><p><strong>${productTitle}</strong> elanınız admin tərəfindən nəzərdən keçirildi və <strong style="color:#166534">təsdiqləndi</strong>. Artıq bazarda görünür.</p>`
        : `<p>Salam,</p><p><strong>${productTitle}</strong> elanınız admin tərəfindən <strong style="color:#b91c1c">rədd edildi</strong>.${reason ? ` Səbəb: ${reason}` : ""}</p><p>Zəhmət olmasa elanı yoxlayıb yenidən göndərin.</p>`
    ),
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  return sendEmail({
    to,
    subject: "FermerMarket — Şifrə Sıfırlama",
    html: wrapper(`
      <h2 style="color:#111827;margin:0 0 12px">🔑 Şifrənizi Sıfırlayın</h2>
      <p style="color:#374151;margin:0 0 20px">
        Hesabınız üçün şifrə sıfırlama tələbi aldıq. Aşağıdakı düyməyə basaraq yeni şifrə təyin edə bilərsiniz.
        Bu link <strong>30 dəqiqə</strong> ərzində etibarlıdır.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
          Şifrəni Sıfırla →
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:16px">
        Əgər bu tələbi siz göndərməmisinizsə, bu e-poçtu lütfən nəzərə almayın.
        Hesabınız təhlükəsizdir.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:8px;word-break:break-all">
        Link işləmirsə kopyalayıb brauzerə yapışdırın: ${resetUrl}
      </p>
    `),
  });
}

export async function sendWelcomeEmail({ to, fullName }) {
  return sendEmail({
    to,
    subject: "FermerMarket-ə xoş gəldiniz! 🌿",
    html: wrapper(`
      <h2 style="color:#111827;margin:0 0 12px">Xoş gəldiniz, ${fullName}! 🌿</h2>
      <p style="color:#374151;margin:0 0 16px">
        FermerMarket ailəsinə qoşulduğunuz üçün təşəkkür edirik. Azərbaycanın ən böyük kənd 
        təsərrüfatı marketplace-inə xoş gəldiniz!
      </p>
      <p style="color:#374151;margin:0 0 20px">
        İndi məhsul axtara, fermerlərlə əlaqə saxlaya və ən təzə kənd məhsullarını sifariş edə bilərsiniz.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://fermermarket.vercel.app'}/products" 
           style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
          Məhsullara bax →
        </a>
      </div>
    `),
  });
}
