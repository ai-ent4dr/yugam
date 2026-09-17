import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/config";
import { logAdminAction } from "@/lib/security";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    const adminDb = createAdminClient();

    // 1. Fetch upload record
    const { data: upload, error: uploadErr } = await adminDb
      .from("uploads")
      .select("id, storage_path, type, original_filename, mime_type")
      .eq("id", id)
      .maybeSingle();

    if (uploadErr || !upload) {
      return NextResponse.json({ error: "Upload record not found" }, { status: 404 });
    }

    // 2. Generate signed URL valid for 15 minutes (900 seconds)
    const { data: signedData, error: signErr } = await adminDb.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(upload.storage_path, 900);

    if (signErr || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Could not generate signed access URL" }, { status: 500 });
    }

    // 3. Log audit event
    await logAdminAction({
      adminUserId: admin.id,
      action: "VIEW_UPLOAD",
      targetType: "upload",
      targetId: id,
      details: { storage_path: upload.storage_path, type: upload.type },
    });

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      type: upload.type,
      originalFilename: upload.original_filename,
      mimeType: upload.mime_type,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
