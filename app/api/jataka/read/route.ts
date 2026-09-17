import { NextRequest, NextResponse } from "next/server";
import { readJatakaDocument } from "@/lib/ai/jataka";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`jataka:${ip}`, 10)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.documentPath || !body.consent) {
    return NextResponse.json(
      { error: "Please upload a document and confirm consent." },
      { status: 400 }
    );
  }

  const { documentPath, name = "Individual", dob, tob, birthPlace } = body;

  let inlineData: { mimeType: string; data: string } | undefined = undefined;

  try {
    const adminDb = createAdminClient();
    const { data, error } = await adminDb.storage.from(STORAGE_BUCKET).download(documentPath);
    if (!error && data) {
      const buffer = Buffer.from(await data.arrayBuffer());
      const isPdf = documentPath.endsWith(".pdf");
      inlineData = {
        mimeType: isPdf ? "application/pdf" : "image/jpeg",
        data: buffer.toString("base64"),
      };
    }
  } catch (err) {
    console.warn("Storage download notice:", err);
  }

  try {
    const reading = await readJatakaDocument(
      {
        storagePath: documentPath,
        inlineData,
      },
      { name, dob, tob, birthPlace }
    );

    return NextResponse.json({ success: true, reading });
  } catch (err: any) {
    console.error("Jataka reading processing error:", err);
    return NextResponse.json(
      { error: "The uploaded Jataka could not be read reliably. Please upload a clearer image or PDF." },
      { status: 500 }
    );
  }
}
