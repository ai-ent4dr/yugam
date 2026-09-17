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

    // Get Auth user
    const { data: authUser, error: authError } = await adminDb.auth.admin.getUserById(id);
    if (authError || !authUser?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get Profile
    const { data: profile } = await adminDb
      .from("profiles")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();

    // Get Analyses
    const { data: analyses } = await adminDb
      .from("analyses")
      .select(
        `
        id,
        status,
        created_at,
        compatibility_results (overall_score),
        analysis_people (name, person_role)
      `
      )
      .eq("owner_user_id", id)
      .order("created_at", { ascending: false });

    await logAdminAction({
      adminUserId: admin.id,
      action: "VIEW_USER",
      targetType: "user",
      targetId: id,
    });

    return NextResponse.json({
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        createdAt: authUser.user.created_at,
        lastSignInAt: authUser.user.last_sign_in_at,
        confirmedAt: authUser.user.confirmed_at,
      },
      profile: profile ?? null,
      analyses: analyses ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
