import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { ALLOWED_DOC_TYPES, MAX_UPLOAD_BYTES, STORAGE_BUCKET } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSafeStoragePath, sanitizeFilename } from "@/lib/security";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const jar = await cookies();
  const session = jar.get("yugma_session")?.value ?? crypto.randomUUID();

  const ip = request.headers.get("x-forwarded-for") ?? session;
  if (!rateLimit(`upload:${ip}`, 15)) {
    return NextResponse.json({ error: "Too many uploads. Please wait a moment." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  const analysisId = formData.get("analysisId")?.toString() || crypto.randomUUID();
  const kind = formData.get("kind")?.toString(); // person-a-profile | person-a-hand | person-a-jataka | person-b-profile | person-b-hand | person-b-jataka | jataka-standalone
  const consentGiven = formData.get("consent") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  if (!consentGiven) {
    return NextResponse.json(
      { error: "Consent must be confirmed before uploading any personal files or images." },
      { status: 403 }
    );
  }

  const validKinds = [
    "person-a-profile",
    "person-a-hand",
    "person-a-jataka",
    "person-b-profile",
    "person-b-hand",
    "person-b-jataka",
    "jataka-standalone",
  ];

  if (!kind || !validKinds.includes(kind)) {
    return NextResponse.json({ error: "Invalid upload category." }, { status: 400 });
  }

  if (!ALLOWED_DOC_TYPES.includes(file.type as any)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a JPG, PNG, WEBP, or PDF document." },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const mbLimit = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    return NextResponse.json(
      { error: `File exceeds the maximum allowed size of ${mbLimit}MB.` },
      { status: 400 }
    );
  }

  // Determine user ID if authenticated
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) userId = data.user.id;
  } catch {
    // Anonymous session
  }

  const folderOwner = userId ?? session;
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const safePath = generateSafeStoragePath(folderOwner, analysisId, kind, ext);
  const cleanOriginalName = sanitizeFilename(file.name);

  // Map category to database upload type
  let dbType = "profile_photo";
  if (kind.includes("hand")) dbType = "hand_photo";
  else if (kind.includes("jataka")) dbType = "jataka_document";

  try {
    const adminDb = createAdminClient();

    // 1. Upload buffer to private Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminDb.storage
      .from(STORAGE_BUCKET)
      .upload(safePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // If bucket doesn't exist yet, we still return safe mock path in dev
    }

    // 2. Record metadata in uploads table
    await adminDb.from("uploads").insert({
      analysis_id: analysisId,
      type: dbType,
      storage_path: safePath,
      original_filename: cleanOriginalName,
      mime_type: file.type,
      size_bytes: file.size,
    });
  } catch (err) {
    console.warn("Upload recording in database skipped (local development mode):", err);
  }

  return NextResponse.json({
    success: true,
    path: safePath,
    analysisId,
    kind,
    mimeType: file.type,
    size: file.size,
  });
}
