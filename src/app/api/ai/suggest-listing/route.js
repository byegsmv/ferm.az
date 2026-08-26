import { geminiGenerate, isModuleActive } from "@/lib/gemini";

// POST /api/ai/suggest-listing — AI generates listing title + description from image/text
export async function POST(req) {
  try {
    if (!(await isModuleActive("suggest-listing"))) {
      return NextResponse.json({ error: "Bu modul deaktiv edilib" }, { status: 403 });
    }
    const body = await req.json();
    const { image, description, category, productName } = body;

    let prompt = `Sən kənd təsərrüfatı məhsulları üçün elan mətni yazan aqronomsan. Azərbaycan dilində cavab ver.\n`;
    if (productName) prompt += `Məhsul adı: ${productName}\n`;
    if (category) prompt += `Kateqoriya: ${category}\n`;
    if (description) prompt += `İstifadəçinin təsviri: ${description}\n`;
    prompt += `\nJSON formatında cavab ver:\n`;
    prompt += `{\n  "title": "Qısa elan başlığı (max 60 simvol)",\n`;
    prompt += `  "description": "Ətraflı məhsul təsviri (100-200 simvol, ekoloji təmizlik, keyfiyyət vurğusu ilə)",\n`;
    prompt += `  "suggestedPrice": "0.00",\n`;
    prompt += `  "tags": ["tag1", "tag2", "tag3"]\n}\n`;
    prompt += `Yalnız JSON cavab ver.`;

    const aiResponse = await geminiGenerate({
      prompt,
      imageBase64: image || null,
      maxOutputTokens: 1024,
    });

    let result = null;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    } catch (e) {}

    if (!result) {
      return Response.json({
        title: "AI tərəfindən təklif olunan elan başlığı",
        description: aiResponse.slice(0, 300),
        suggestedPrice: "0.00",
        tags: [],
      });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
