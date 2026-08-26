import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export const DEFAULT_PAYMENT_CONFIG = {
  bankName: "ABB Bank / Kapital Bank",
  bankCardNumber: "4169 7388 1234 5678",
  bankCardHolder: "Fermer Market MMC",
  m10Number: "+994 10 521 09 09",
  m10Holder: "Fermer Market",
  allowCardTransfer: true,
  allowM10: true,
  allowCash: true,
  allowWallet: true,
  instructions: "Ödəniş etdikdən sonra qəbzin şəklini və ya skrinşotunu yükləyin. Sifarişiniz təsdiqlənərək çatdırılmaya yönləndiriləcəkdir.",
};

// GET /api/config/payment-methods — public payment accounts for checkout
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "payment_accounts_config" },
    });

    let accounts = DEFAULT_PAYMENT_CONFIG;
    if (setting?.value) {
      try {
        accounts = { ...DEFAULT_PAYMENT_CONFIG, ...JSON.parse(setting.value) };
      } catch {}
    }
    return Response.json({ success: true, paymentAccounts: accounts });
  } catch (error) {
    console.error("GET payment methods config error:", error);
    return Response.json({ success: true, paymentAccounts: DEFAULT_PAYMENT_CONFIG });
  }
}

// PATCH /api/config/payment-methods — Admin / Super Admin update
export async function PATCH(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const currentSetting = await prisma.setting.findUnique({
      where: { key: "payment_accounts_config" },
    });

    let currentVal = DEFAULT_PAYMENT_CONFIG;
    if (currentSetting?.value) {
      try {
        currentVal = JSON.parse(currentSetting.value);
      } catch {}
    }

    const merged = {
      ...currentVal,
      ...body,
    };

    const saved = await prisma.setting.upsert({
      where: { key: "payment_accounts_config" },
      update: { value: JSON.stringify(merged), updatedAt: new Date() },
      create: {
        key: "payment_accounts_config",
        value: JSON.stringify(merged),
        category: "payment",
      },
    });

    return Response.json({ success: true, paymentAccounts: JSON.parse(saved.value) });
  } catch (error) {
    console.error("PATCH payment methods error:", error);
    return Response.json({ error: "Ödəniş hesabları saxlanılmadı" }, { status: 500 });
  }
}
