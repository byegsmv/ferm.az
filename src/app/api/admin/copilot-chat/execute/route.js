
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    // Yalnız yüksək səlahiyyətli adminlər verilənlər bazasına müdaxilə edə bilər
    const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
    if (denied) return denied;

    const { code } = await req.json();
    if (!code) {
      return Response.json({ error: "İcra kodu tapılmadı" }, { status: 400 });
    }

    if (!code.includes("prisma.")) {
      return Response.json({ error: "Yalnız prisma əməliyyatlarına icazə verilir" }, { status: 403 });
    }

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const executeCode = new AsyncFunction("prisma", `return ${code};`);
    
    const result = await executeCode(prisma);

    return Response.json({ success: true, result });
  } catch (error) {
    console.error("Admin Copilot Execute Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

