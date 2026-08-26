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
    const block = await prisma.dynamicBlock.findFirst({
      where: { key: "payment_accounts_config" },
    });

    const accounts = block?.props ? { ...DEFAULT_PAYMENT_CONFIG, ...block.props } : DEFAULT_PAYMENT_CONFIG;
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
    const currentBlock = await prisma.dynamicBlock.findFirst({
      where: { key: "payment_accounts_config" },
    });

    const merged = {
      ...(currentBlock?.props || DEFAULT_PAYMENT_CONFIG),
      ...body,
    };

    const saved = await prisma.dynamicBlock.upsert({
      where: { key: "payment_accounts_config" },
      update: { props: merged, updatedAt: new Date() },
      create: {
        key: "payment_accounts_config",
        type: "payment_config",
        props: merged,
      },
    });

    return Response.json({ success: true, paymentAccounts: saved.props });
  } catch (error) {
    console.error("PATCH payment methods error:", error);
    return Response.json({ error: "Ödəniş hesabları saxlanılmadı" }, { status: 500 });
  }
}
