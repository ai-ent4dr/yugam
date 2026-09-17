import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localAnalysisStore } from "@/lib/analysis-store";
import { ADMIN_EMAILS } from "@/lib/config";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing analysis ID" }, { status: 400 });

  const jar = await cookies();
  const session = jar.get("yugma_session")?.value;

  let currentUser: { id: string; email?: string } | null = null;
  let isAdmin = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      currentUser = data.user;
      isAdmin = Boolean(data.user.email && ADMIN_EMAILS.has(data.user.email.toLowerCase()));
    }
  } catch {
    // Unauthenticated
  }

  // Check local store first (useful for dev and immediate rendering)
  const local = localAnalysisStore.get(id);
  if (local) {
    if (
      isAdmin ||
      (currentUser && local.ownerUserId === currentUser.id) ||
      (session && local.sessionId === session)
    ) {
      return NextResponse.json(local);
    }
  }

  try {
    const adminDb = createAdminClient();
    const { data: analysis, error } = await adminDb
      .from("analyses")
      .select(
        `
        id,
        status,
        created_at,
        owner_user_id,
        session_id,
        analysis_people (*),
        compatibility_results (*),
        jataka_readings (*),
        numerology_readings (*),
        palm_readings (*),
        future_readings (*),
        uploads (*)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const isOwner = currentUser && analysis.owner_user_id === currentUser.id;
    const isSessionOwner = session && analysis.session_id === session;

    if (!isAdmin && !isOwner && !isSessionOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(analysis);
  } catch {
    if (local) return NextResponse.json(local);
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }
}
