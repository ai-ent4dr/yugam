import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/security";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const adminDb = createAdminClient();

    const { data: analyses, error } = await adminDb
      .from("analyses")
      .select(
        `
        id,
        owner_user_id,
        session_id,
        status,
        free_or_paid,
        created_at,
        compatibility_results (overall_score),
        analysis_people (name, person_role)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    await logAdminAction({
      adminUserId: admin.id,
      action: "VIEW_ANALYSIS",
      targetType: "analyses_list",
    });

    return NextResponse.json(analyses ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
