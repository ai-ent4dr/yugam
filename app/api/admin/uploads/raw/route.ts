import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getLocalUpload } from "@/lib/analysis-store";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  const id = request.nextUrl.searchParams.get("id");
  const identifier = path || id;

  if (!identifier) {
    return new NextResponse("Missing file path or id parameter", { status: 400 });
  }

  // 1. Try resolving from local upload store / disk
  try {
    const local = await getLocalUpload(identifier);
    if (local?.buffer) {
      const mime = local.meta?.mimeType || (identifier.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      const filename = local.meta?.originalFilename || "upload";
      return new NextResponse(local.buffer as any, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch (err) {
    console.error("Local upload lookup error:", err);
  }

  // 2. Try Supabase Storage if configured
  if (isSupabaseAdminConfigured() && path) {
    try {
      const adminDb = createAdminClient();
      const { data, error } = await adminDb.storage.from(STORAGE_BUCKET).download(path);
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        const ext = path.split(".").pop()?.toLowerCase();
        const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
        return new NextResponse(buffer as any, {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `inline; filename="${encodeURIComponent(path.split("/").pop() || "download")}"`,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (err) {
      console.warn("Supabase download fallback error:", err);
    }
  }

  return new NextResponse("File not found in storage", { status: 404 });
}
