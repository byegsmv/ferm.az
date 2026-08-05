/**
 * SMS sending utility.
 * Uses a configurable SMS gateway via env vars (SMS_API_URL, SMS_API_KEY, SMS_SENDER).
 * If not configured, falls back to returning the OTP in the response (dev mode).
 * Supports any HTTP-based SMS API that accepts POST with JSON body.
 */

export async function sendSMS({ to, message }) {
  const smsApiUrl = process.env.SMS_API_URL;
  const smsApiKey = process.env.SMS_API_KEY;
  const smsSender = process.env.SMS_SENDER || "FermerMarket";

  if (!smsApiUrl || !smsApiKey) {
    console.warn(`[sms] SMS_API_URL or SMS_API_KEY not set — skipping SMS to ${to}: ${message.substring(0, 50)}...`);
    return { skipped: true, message: "SMS xidməti konfiqurasiya edilməyib" };
  }

  if (!to) return { skipped: true };

  // Normalize phone number (remove spaces, dashes, leading +)
  const normalizedPhone = to.replace(/[\s\-()]/g, "");

  try {
    // Generic SMS API — works with most providers (e.g., sms.az, twilio proxy, etc.)
    const response = await fetch(smsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${smsApiKey}`,
      },
      body: JSON.stringify({
        sender: smsSender,
        recipient: normalizedPhone,
        message,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[sms] SMS API error ${response.status}: ${text}`);
      return { error: `SMS xətası: ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    console.error(`[sms] Failed to send SMS to ${to}:`, err.message);
    return { error: err.message };
  }
}

/**
 * Generate a 6-digit OTP code.
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
