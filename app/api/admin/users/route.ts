import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/security";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const adminDb = createAdminClient();

    // Fetch auth users using service role
    const { data: authData, error: authError } = await adminDb.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    if (authError) throw authError;

    // Fetch profiles
    const { data: profiles } = await adminDb
      .from("profiles")
      .select("user_id, name, created_at, updated_at");

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // Fetch analysis counts per user
    const { data: userAnalyses } = await adminDb
      .from("analyses")
      .select("owner_user_id");

    const counts: Record<string, number> = {};
    for (const a of userAnalyses ?? []) {
      if (a.owner_user_id) {
        counts[a.owner_user_id] = (counts[a.owner_user_id] || 0) + 1;
      }
    }

    const users = (authData.users ?? []).map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        name: p?.name || "Anonymous / Unset",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        analysisCount: counts[u.id] || 0,
        status: u.confirmed_at ? "active" : "unconfirmed",
      };
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "VIEW_USER",
      targetType: "users_list",
    });

    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
