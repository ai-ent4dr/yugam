import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/config";
import { logAdminAction } from "@/lib/security";
import { getLocalUpload, localUploadMetaStore } from "@/lib/analysis-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    // 1. If Supabase Admin is configured, try Supabase first
    if (isSupabaseAdminConfigured()) {
      try {
        const adminDb = createAdminClient();
        const { data: upload } = await adminDb
          .from("uploads")
          .select("id, storage_path, type, original_filename, mime_type")
          .eq("id", id)
          .maybeSingle();

        if (upload?.storage_path) {
          const { data: signedData } = await adminDb.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(upload.storage_path, 900);

          if (signedData?.signedUrl) {
            await logAdminAction({
              adminUserId: admin.id,
              action: "VIEW_UPLOAD",
              targetType: "upload",
              targetId: id,
              details: { storage_path: upload.storage_path, type: upload.type },
            }).catch(() => undefined);

            return NextResponse.json({
              success: true,
              signedUrl: signedData.signedUrl,
              type: upload.type,
              originalFilename: upload.original_filename,
              mimeType: upload.mime_type,
            });
          }
        }
      } catch {
        // Fallback to local store
      }
    }

    // 2. Check local upload store / disk
    const local = await getLocalUpload(id);
    if (local) {
      return NextResponse.json({
        success: true,
        signedUrl: `/api/admin/uploads/raw?path=${encodeURIComponent(local.meta.storagePath)}`,
        type: local.meta.type,
        originalFilename: local.meta.originalFilename,
        mimeType: local.meta.mimeType,
      });
    }

    // Check meta store by id
    const meta = localUploadMetaStore.get(id);
    if (meta) {
      return NextResponse.json({
        success: true,
        signedUrl: `/api/admin/uploads/raw?path=${encodeURIComponent(meta.storagePath)}`,
        type: meta.type,
        originalFilename: meta.originalFilename,
        mimeType: meta.mimeType,
      });
    }

    // Fallback direct URL by ID
    return NextResponse.json({
      success: true,
      signedUrl: `/api/admin/uploads/raw?id=${encodeURIComponent(id)}`,
      type: "profile_photo",
      originalFilename: "uploaded-file",
      mimeType: id.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
