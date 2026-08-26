import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword, verifyPassword } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validators";
import { z } from "zod";

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: authUser.sub },
    select: {
      id: true, email: true, phone: true, fullName: true, role: true,
      status: true, locale: true, emailVerified: true, phoneVerified: true,
      createdAt: true,
      store: { select: { id: true, name: true, slug: true, description: true, address: true, phone: true, whatsapp: true, logoUrl: true, coverUrl: true, isVerified: true, isActive: true, installmentEnabled: true, installmentWhatsapp: true } },
      ownedStores: { select: { id: true, name: true, slug: true, isVerified: true, isActive: true } },
      modules: { select: { module: true } },
    },
  });

  if (!user) return Response.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
  return Response.json({ user });
}

export async function PATCH(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  // Handle password change if requested
  if (body.oldPassword || body.newPassword) {
    if (!body.oldPassword || !body.newPassword) {
      return Response.json({ error: "Köhnə və yeni şifrə tələb olunur" }, { status: 400 });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: authUser.sub } });
    const isOk = await verifyPassword(body.oldPassword, dbUser.passwordHash);
    if (!isOk) {
      return Response.json({ error: "Köhnə şifrə yanlışdır" }, { status: 400 });
    }
    if (body.newPassword.length < 8) {
      return Response.json({ error: "Şifrə ən azı 8 simvol olmalıdır" }, { status: 400 });
    }
    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({
      where: { id: authUser.sub },
      data: { passwordHash }
    });
    return Response.json({ message: "Şifrə uğurla dəyişdirildi" });
  }

  // Profile fields update
  const allowedData = {};
  if (body.fullName !== undefined) allowedData.fullName = body.fullName;
  if (body.phone !== undefined) allowedData.phone = body.phone;
  if (body.region !== undefined) allowedData.region = body.region;
  if (body.city !== undefined) allowedData.city = body.city;

  const user = await prisma.user.update({
    where: { id: authUser.sub },
    data: allowedData,
    select: { id: true, email: true, fullName: true, phone: true, locale: true, region: true, city: true },
  });

  return Response.json({ user });
}
