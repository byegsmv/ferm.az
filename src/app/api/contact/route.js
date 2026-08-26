import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.name || !data.email || !data.message) {
      return Response.json(
        { error: "Ad, email və mesaj xanaları mütləqdir." },
        { status: 400 }
      );
    }

    const message = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || null,
        message: data.message,
      },
    });

    return Response.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("Contact API Error:", error);
    return Response.json(
      { error: "Mesaj göndərilərkən xəta baş verdi." },
      { status: 500 }
    );
  }
}
