import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getAllStoredAnalyses } from "@/lib/analysis-store";
import { logAdminAction } from "@/lib/security";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const analysesMap = new Map<string, any>();

    if (isSupabaseAdminConfigured()) {
      try {
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
            analysis_people (name, person_role, city, dob),
            uploads (id, storage_path, type)
          `
          )
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && analyses) {
          analyses.forEach((a: any) => {
            a.upload_count = Array.isArray(a.uploads) ? a.uploads.length : 0;
            const pA = (a.analysis_people || []).find((p: any) => p.person_role === "A");
            const pB = (a.analysis_people || []).find((p: any) => p.person_role === "B");

            if (Array.isArray(a.uploads)) {
              for (const u of a.uploads) {
                const path = u.storage_path || "";
                if (pA) {
                  if (path.includes("person-a-profile") || (u.type === "profile_photo" && !pA.profilePhotoPath)) pA.profilePhotoPath = path;
                  if (path.includes("person-a-hand") || (u.type === "hand_photo" && !pA.handPhotoPath)) pA.handPhotoPath = path;
                  if (path.includes("person-a-jataka") || (u.type === "jataka_document" && !pA.jatakaPath)) pA.jatakaPath = path;
                }
                if (pB) {
                  if (path.includes("person-b-profile")) pB.profilePhotoPath = path;
                  if (path.includes("person-b-hand")) pB.handPhotoPath = path;
                  if (path.includes("person-b-jataka")) pB.jatakaPath = path;
                }
              }
            }
            a.personA = pA;
            a.personB = pB;
            analysesMap.set(a.id, a);
          });
        }
      } catch {
        // Supabase query error fallback
      }
    }

    // Local fallback
    const localList = getAllStoredAnalyses();
    for (const rec of localList) {
      if (!analysesMap.has(rec.id)) {
        const uploadCount = [
          rec.personA?.profilePhotoPath,
          rec.personA?.handPhotoPath,
          rec.personA?.jatakaPath,
          rec.personB?.profilePhotoPath,
          rec.personB?.handPhotoPath,
          rec.personB?.jatakaPath,
        ].filter(Boolean).length;

        analysesMap.set(rec.id, {
          id: rec.id,
          owner_user_id: rec.ownerUserId,
          session_id: rec.sessionId,
          status: rec.status || "completed",
          free_or_paid: "free",
          created_at: rec.createdAt,
          compatibility_results: { overall_score: rec.match?.score ?? 0 },
          analysis_people: [
            {
              name: rec.personA?.name,
              person_role: "A",
              city: rec.personA?.city,
              dob: rec.personA?.dob,
              profilePhotoPath: rec.personA?.profilePhotoPath,
              handPhotoPath: rec.personA?.handPhotoPath,
              jatakaPath: rec.personA?.jatakaPath,
            },
            {
              name: rec.personB?.name,
              person_role: "B",
              city: rec.personB?.city,
              dob: rec.personB?.dob,
              profilePhotoPath: rec.personB?.profilePhotoPath,
              handPhotoPath: rec.personB?.handPhotoPath,
              jatakaPath: rec.personB?.jatakaPath,
            },
          ],
          upload_count: uploadCount,
          personA: rec.personA,
          personB: rec.personB,
        });
      }
    }

    try {
      await logAdminAction({
        adminUserId: admin.id,
        action: "VIEW_ANALYSIS",
        targetType: "analyses_list",
      });
    } catch {
      // audit log fallback
    }

    return NextResponse.json(Array.from(analysesMap.values()));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
