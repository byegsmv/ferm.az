import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'label' or 'instruction'

    if (!type || (type !== "label" && type !== "instruction")) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { labelPdf: true, labelPdfUrl: true, instructionPdf: true, instructionPdfUrl: true, slug: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let fileUrl = null;
    let fileName = "file.pdf";

    if (type === "label") {
      fileUrl = product.labelPdfUrl || product.labelPdf;
      fileName = `${product.slug}-label.pdf`;
    } else if (type === "instruction") {
      fileUrl = product.instructionPdfUrl || product.instructionPdf;
      fileName = `${product.slug}-instruction.pdf`;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file from source" }, { status: response.status });
    }

    const headers = new Headers(response.headers);
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    headers.set("Content-Type", "application/pdf");

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
