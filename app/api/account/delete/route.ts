import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const action = body.action; // "delete-uploads" | "delete-analyses" | "delete-account"
    const adminDb = createAdminClient();

    if (action === "delete-uploads" || action === "delete-account") {
      // 1. Find all uploads for this user's analyses
      const { data: userAnalyses } = await adminDb
        .from("analyses")
        .select("id")
        .eq("owner_user_id", user.id);

      const analysisIds = (userAnalyses || []).map((a) => a.id);
      if (analysisIds.length > 0) {
        const { data: uploads } = await adminDb
          .from("uploads")
          .select("storage_path")
          .in("analysis_id", analysisIds);

        if (uploads && uploads.length > 0) {
          const paths = uploads.map((u) => u.storage_path);
          await adminDb.storage.from(STORAGE_BUCKET).remove(paths);
          await adminDb.from("uploads").delete().in("analysis_id", analysisIds);
        }
      }
    }

    if (action === "delete-analyses" || action === "delete-account") {
      await adminDb.from("analyses").delete().eq("owner_user_id", user.id);
    }

    if (action === "delete-account") {
      await adminDb.from("profiles").delete().eq("user_id", user.id);
      await adminDb.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json({ success: true, message: `Action '${action}' completed successfully.` });
  } catch (err: any) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 });
  }
}
