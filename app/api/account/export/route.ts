import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminDb = createAdminClient();

    // Fetch profile
    const { data: profile } = await adminDb
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch analyses and associated people, results, and uploads metadata
    const { data: analyses } = await adminDb
      .from("analyses")
      .select(
        `
        id,
        status,
        analysis_type,
        created_at,
        analysis_people (*),
        compatibility_results (*),
        jataka_readings (*),
        numerology_readings (*),
        palm_readings (*),
        future_readings (*),
        uploads (id, type, storage_path, original_filename, mime_type, size_bytes, created_at)
      `
      )
      .eq("owner_user_id", user.id);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: profile ?? null,
      analyses: analyses ?? [],
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="yugma-data-export-${user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Export failed" }, { status: 500 });
  }
}
