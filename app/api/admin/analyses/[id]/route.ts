import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/security";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    const adminDb = createAdminClient();
    const { data: analysis, error } = await adminDb
      .from("analyses")
      .select(
        `
        id,
        owner_user_id,
        session_id,
        status,
        free_or_paid,
        created_at,
        analysis_people (*),
        compatibility_results (*),
        jataka_readings (*),
        numerology_readings (*),
        palm_readings (*),
        future_readings (*),
        consents (*),
        uploads (*)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    await logAdminAction({
      adminUserId: admin.id,
      action: "VIEW_ANALYSIS",
      targetType: "analysis",
      targetId: id,
    });

    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
