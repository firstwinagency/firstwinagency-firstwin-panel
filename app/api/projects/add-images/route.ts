import { NextRequest, NextResponse } from "next/server";
import { addImageToProject } from "@/lib/projectStore";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const projectId = formData.get("projectId") as string;
    const asin = formData.get("asin") as string | null;
    const referencia = formData.get("referencia") as string | null;
    const file = formData.get("file") as File;

    if (!projectId || !file) {
      return NextResponse.json(
        { error: "projectId y file son obligatorios" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const image = await addImageToProject({
      projectId,
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      asin,
      referencia,
    });

    return NextResponse.json({ success: true, image });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
