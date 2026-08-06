import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/calculator
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { productId, manualUseNorm, manualWaterNorm, area, areaUnit, applications = 1 } = body;

  if (!area || isNaN(area)) {
    return Response.json({ error: "Sahə (area) daxil edilməlidir" }, { status: 422 });
  }

  const authUser = await getAuthUser(request);

  try {
    let useNorm = 0;
    let waterNorm = 300; // default water norm L/ha
    let productPrice = 0;
    const currency = "AZN";
    let packagingList = ["1L"];
    let productName = "Manual Giriş";
    let isLiquid = true;

    // Helper to parse norms
    const parseNormVal = (str) => {
      if (!str) return 0;
      const matches = str.match(/(\d+(\.\d+)?)/g);
      if (!matches) return 0;
      const nums = matches.map(Number);
      return nums.reduce((a, b) => a + b, 0) / nums.length; // average
    };

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
      }

      productName = product.titleAz;
      productPrice = Number(product.price);
      useNorm = parseNormVal(product.useNorm);
      if (product.waterVolume) {
        waterNorm = parseNormVal(product.waterVolume);
      }
      if (product.packaging) {
        packagingList = product.packaging.split(",").map(p => p.trim());
      }
      isLiquid = product.useNorm?.toLowerCase().includes("l") || product.packaging?.toLowerCase().includes("l") || true;
    } else {
      useNorm = Number(manualUseNorm || 0);
      waterNorm = Number(manualWaterNorm || 300);
    }

    const areaInHectares = areaUnit === "ha" ? area : area * 0.01;

    // 1. Calculate totals
    const totalAmount = useNorm * areaInHectares * applications;
    const totalWater = waterNorm * areaInHectares * applications;
    const totalCost = productPrice * totalAmount;
    const hectareCost = productPrice * useNorm;

    // 2. Package Optimization
    // Try to parse packaging options, e.g. "1L", "5L", "20L" -> parse numbers: 1, 5, 20
    const packages = packagingList
      .map(p => {
        const num = parseFloat(p);
        return { label: p, val: isNaN(num) ? 1 : num };
      })
      .sort((a, b) => b.val - a.val); // descending order: 20L, 5L, 1L

    let remaining = totalAmount;
    const optimizedPackages = [];
    
    if (packages.length > 0 && remaining > 0) {
      for (const pkg of packages) {
        if (remaining >= pkg.val) {
          const qty = Math.floor(remaining / pkg.val);
          optimizedPackages.push({ label: pkg.label, qty });
          remaining -= qty * pkg.val;
        }
      }
      // If there is still remaining, add 1 of the smallest package
      if (remaining > 0) {
        const smallestPkg = packages[packages.length - 1];
        const existing = optimizedPackages.find(p => p.label === smallestPkg.label);
        if (existing) {
          existing.qty += 1;
        } else {
          optimizedPackages.push({ label: smallestPkg.label, qty: 1 });
        }
      }
    }

    const result = {
      productName,
      useNorm,
      waterNorm,
      area,
      areaUnit,
      applications,
      totalAmount: Number(totalAmount.toFixed(2)),
      totalWater: Number(totalWater.toFixed(1)),
      totalCost: Number(totalCost.toFixed(2)),
      hectareCost: Number(hectareCost.toFixed(2)),
      currency,
      optimizedPackages,
      isLiquid
    };

    // 3. Log session in database
    await prisma.calculatorSession.create({
      data: {
        userId: authUser?.sub || null,
        productId: productId || null,
        area,
        areaUnit,
        useNorm,
        waterNorm,
        applications,
        result
      }
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message || "Hesablama xətası" }, { status: 500 });
  }
}
