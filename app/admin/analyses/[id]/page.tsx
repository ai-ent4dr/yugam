import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getStoredAnalysis, getAllStoredUploads } from "@/lib/analysis-store";
import AdminUploadViewer from "./upload-viewer";

export default async function AdminAnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  let analysis: any = null;

  // 1. Try Supabase if configured
  if (isSupabaseAdminConfigured()) {
    try {
      const adminDb = createAdminClient();
      const { data, error } = await adminDb
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
          consents (*),
          uploads (*)
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (!error && data) analysis = data;
    } catch {
      // Local fallback
    }
  }

  // 2. Check local persistent store
  const stored = getStoredAnalysis(id);
  if (stored) {
    analysis = {
      id: stored.id,
      status: stored.status ?? "completed",
      created_at: stored.createdAt ?? new Date().toISOString(),
      owner_user_id: stored.ownerUserId ?? null,
      session_id: stored.sessionId ?? "anonymous-session",
      analysis_people: [
        {
          person_role: "A",
          name: stored.personA?.name ?? "Person A",
          gender: stored.personA?.gender ?? "",
          dob: stored.personA?.dob ?? "",
          tob: stored.personA?.tob ?? "",
          birth_place: stored.personA?.birthPlace ?? "",
          city: stored.personA?.city ?? "",
          education: stored.personA?.education ?? "",
          career: stored.personA?.career ?? "",
          relationship_goal: stored.personA?.relationshipGoal ?? "",
          career_goal: stored.personA?.careerGoal ?? "",
          values: stored.personA?.values ?? [],
          lifestyle: stored.personA?.lifestyle ?? [],
        },
        {
          person_role: "B",
          name: stored.personB?.name ?? "Person B",
          gender: stored.personB?.gender ?? "",
          dob: stored.personB?.dob ?? "",
          tob: stored.personB?.tob ?? "",
          birth_place: stored.personB?.birthPlace ?? "",
          city: stored.personB?.city ?? "",
          education: stored.personB?.education ?? "",
          career: stored.personB?.career ?? "",
          relationship_goal: stored.personB?.relationshipGoal ?? "",
          career_goal: stored.personB?.careerGoal ?? "",
          values: stored.personB?.values ?? [],
          lifestyle: stored.personB?.lifestyle ?? [],
        },
      ],
      compatibility_results: {
        overall_score: stored.match?.score ?? 75,
        values_score: stored.match?.breakdown?.values ?? 75,
        relationship_score: stored.match?.breakdown?.relationshipGoals ?? 75,
        lifestyle_score: stored.match?.breakdown?.lifestyle ?? 70,
        career_score: stored.match?.breakdown?.careerGoals ?? 75,
        age_score: stored.match?.breakdown?.ageCompatibility ?? 75,
        location_score: stored.match?.breakdown?.location ?? 70,
        education_score: stored.match?.breakdown?.educationInterests ?? 70,
        explanation: {
          strengths: stored.match?.strengths ?? [],
          challenges: stored.match?.challenges ?? [],
          practicalSuggestions: stored.match?.practicalSuggestions ?? [],
        },
      },
      raw_record: stored,
      jataka_readings: stored.aiReport?.jatakaInsights ? [{ reading_data: { insights: stored.aiReport.jatakaInsights, uploaded: stored.aiReport.uploadedJatakaInsights } }] : [],
      numerology_readings: stored.numerology ? [{ reading_data: { personA: stored.numerology.personA, personB: stored.numerology.personB, compatibility: stored.numerology.compatibility } }] : [],
      palm_readings: stored.aiReport?.palmistryInsights ? [{ reading_data: { insights: stored.aiReport.palmistryInsights } }] : [],
      future_readings: stored.futureThemes ? [{ reading_data: { futureThemes: stored.futureThemes } }] : [],
    };
  }

  // 3. Fallback mock if completely new
  if (!analysis) {
    analysis = {
      id,
      status: "completed",
      created_at: new Date().toISOString(),
      owner_user_id: null,
      session_id: "anonymous-session",
      analysis_people: [
        { person_role: "A", name: "Person A", gender: "male", dob: "1996-05-12", tob: "14:30", birth_place: "Mumbai", city: "Mumbai" },
        { person_role: "B", name: "Person B", gender: "female", dob: "1998-09-24", tob: "08:15", birth_place: "Delhi", city: "Bangalore" },
      ],
      compatibility_results: {
        overall_score: 84,
        values_score: 85,
        relationship_score: 80,
        lifestyle_score: 75,
        career_score: 90,
        age_score: 88,
        location_score: 65,
        education_score: 80,
      },
    };
  }

  const personA = (analysis.analysis_people || []).find((p: any) => p.person_role === "A");
  const personB = (analysis.analysis_people || []).find((p: any) => p.person_role === "B");
  const compat = Array.isArray(analysis.compatibility_results)
    ? analysis.compatibility_results[0]
    : analysis.compatibility_results;
  const jataka = Array.isArray(analysis.jataka_readings) ? analysis.jataka_readings[0] : analysis.jataka_readings;
  const numerology = Array.isArray(analysis.numerology_readings) ? analysis.numerology_readings[0] : analysis.numerology_readings;
  const palm = Array.isArray(analysis.palm_readings) ? analysis.palm_readings[0] : analysis.palm_readings;
  const future = Array.isArray(analysis.future_readings) ? analysis.future_readings[0] : analysis.future_readings;

  // Build comprehensive list of uploaded files (from Supabase uploads + analysis person paths + local upload store)
  const uploadsMap = new Map<string, any>();

  // Add from Supabase analysis.uploads
  if (Array.isArray(analysis.uploads)) {
    for (const u of analysis.uploads) {
      uploadsMap.set(u.storage_path, {
        id: u.id,
        type: u.type,
        storage_path: u.storage_path,
        original_filename: u.original_filename,
        mime_type: u.mime_type,
        size_bytes: u.size_bytes,
        preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(u.storage_path)}`,
      });
    }
  }

  // Add from Person A and Person B direct storage paths
  const pA = analysis.raw_record?.personA || personA;
  const pB = analysis.raw_record?.personB || personB;

  if (pA?.profilePhotoPath && !uploadsMap.has(pA.profilePhotoPath)) {
    uploadsMap.set(pA.profilePhotoPath, {
      id: `pA-profile-${id}`,
      type: "profile_photo",
      storage_path: pA.profilePhotoPath,
      original_filename: `Person A (${pA.name || "Person A"}) Profile Photo`,
      mime_type: "image/jpeg",
      preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(pA.profilePhotoPath)}`,
    });
  }
  if (pA?.handPhotoPath && !uploadsMap.has(pA.handPhotoPath)) {
    uploadsMap.set(pA.handPhotoPath, {
      id: `pA-hand-${id}`,
      type: "hand_photo",
      storage_path: pA.handPhotoPath,
      original_filename: `Person A (${pA.name || "Person A"}) Palm Photo`,
      mime_type: "image/jpeg",
      preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(pA.handPhotoPath)}`,
    });
  }
  if (pA?.jatakaPath && !uploadsMap.has(pA.jatakaPath)) {
    uploadsMap.set(pA.jatakaPath, {
      id: `pA-jataka-${id}`,
      type: "jataka_document",
      storage_path: pA.jatakaPath,
      original_filename: `Person A (${pA.name || "Person A"}) Kundli / Jataka Document`,
      mime_type: pA.jatakaPath.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(pA.jatakaPath)}`,
    });
  }

  if (pB?.profilePhotoPath && !uploadsMap.has(pB.profilePhotoPath)) {
    uploadsMap.set(pB.profilePhotoPath, {
      id: `pB-profile-${id}`,
      type: "profile_photo",
      storage_path: pB.profilePhotoPath,
      original_filename: `Person B (${pB.name || "Person B"}) Profile Photo`,
      mime_type: "image/jpeg",
      preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(pB.profilePhotoPath)}`,
    });
  }
  if (pB?.handPhotoPath && !uploadsMap.has(pB.handPhotoPath)) {
    uploadsMap.set(pB.handPhotoPath, {
      id: `pB-hand-${id}`,
      type: "hand_photo",
      storage_path: pB.handPhotoPath,
      original_filename: `Person B (${pB.name || "Person B"}) Palm Photo`,
      mime_type: "image/jpeg",
      preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(pB.handPhotoPath)}`,
    });
  }
  if (pB?.jatakaPath && !uploadsMap.has(pB.jatakaPath)) {
    uploadsMap.set(pB.jatakaPath, {
      id: `pB-jataka-${id}`,
      type: "jataka_document",
      storage_path: pB.jatakaPath,
      original_filename: `Person B (${pB.name || "Person B"}) Kundli / Jataka Document`,
      mime_type: pB.jatakaPath.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(pB.jatakaPath)}`,
    });
  }

  // Also merge any uploads recorded with this analysisId in localUploadStore
  const localUploads = getAllStoredUploads(id);
  for (const lu of localUploads) {
    if (!uploadsMap.has(lu.storagePath)) {
      uploadsMap.set(lu.storagePath, {
        id: lu.id,
        type: lu.type,
        storage_path: lu.storagePath,
        original_filename: lu.originalFilename,
        mime_type: lu.mimeType,
        size_bytes: lu.sizeBytes,
        preview_url: `/api/admin/uploads/raw?path=${encodeURIComponent(lu.storagePath)}`,
      });
    }
  }

  const allUploads = Array.from(uploadsMap.values());

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
          <span className="tag">ADMIN</span>
        </a>
        <div className="nav-links">
          <a href="/admin/analyses">← All Analyses</a>
          <a href="/admin/users">Users</a>
          <a href="/admin">Dashboard</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">ADMINISTRATIVE ANALYSIS AUDIT</p>
        <h1 style={{ fontSize: "32px" }}>
          {personA?.name || "Person A"} & {personB?.name || "Person B"}
        </h1>
        <p className="lead" style={{ fontSize: "14px" }}>
          Analysis ID: <code>{id}</code> · Date: {new Date(analysis.created_at).toLocaleString()} ·
          Status: <b style={{ color: "#2ecc71" }}>{analysis.status}</b> ·
          Type: <b style={{ color: "var(--gold-primary)" }}>{analysis.owner_user_id ? "Authenticated Account" : "Anonymous Submission"}</b>
        </p>
      </div>

      {/* Couple Profiles Overview */}
      <div className="form-grid">
        {/* PERSON A */}
        <div className="panel">
          <span className="step-label">PERSON A — SUBMITTED PROFILE</span>
          <h2 style={{ fontSize: "22px", margin: "6px 0 16px" }}>{personA?.name || "Person A"}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Gender:</span>
              <b>{personA?.gender || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Date of Birth:</span>
              <b style={{ color: "var(--gold-primary)" }}>{personA?.dob || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Time of Birth:</span>
              <b>{personA?.tob || "Not provided"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Birth Place:</span>
              <b>{personA?.birth_place || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Current City:</span>
              <b>{personA?.city || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Relationship Goal:</span>
              <b style={{ color: "var(--gold-hover)" }}>{personA?.relationship_goal || "Marriage"}</b>
            </div>
            {personA?.career_goal && (
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-dim)" }}>Career Goal:</span>
                <b>{personA.career_goal}</b>
              </div>
            )}
            {personA?.education && (
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-dim)" }}>Education:</span>
                <b>{personA.education}</b>
              </div>
            )}
            {personA?.career && (
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-dim)" }}>Profession:</span>
                <b>{personA.career}</b>
              </div>
            )}

            {/* Values Tags */}
            {Array.isArray(personA?.values) && personA.values.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase" }}>Core Values:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {personA.values.map((v: string) => (
                    <span key={v} style={{ fontSize: "11px", background: "rgba(228,189,117,0.12)", color: "var(--gold-primary)", padding: "2px 8px", borderRadius: "12px" }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Tags */}
            {Array.isArray(personA?.lifestyle) && personA.lifestyle.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase" }}>Lifestyle:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {personA.lifestyle.map((l: string) => (
                    <span key={l} style={{ fontSize: "11px", background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: "12px" }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PERSON B */}
        <div className="panel">
          <span className="step-label">PERSON B — SUBMITTED PROFILE</span>
          <h2 style={{ fontSize: "22px", margin: "6px 0 16px" }}>{personB?.name || "Person B"}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Gender:</span>
              <b>{personB?.gender || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Date of Birth:</span>
              <b style={{ color: "var(--gold-primary)" }}>{personB?.dob || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Time of Birth:</span>
              <b>{personB?.tob || "Not provided"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Birth Place:</span>
              <b>{personB?.birth_place || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Current City:</span>
              <b>{personB?.city || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-dim)" }}>Relationship Goal:</span>
              <b style={{ color: "var(--gold-hover)" }}>{personB?.relationship_goal || "Marriage"}</b>
            </div>
            {personB?.career_goal && (
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-dim)" }}>Career Goal:</span>
                <b>{personB.career_goal}</b>
              </div>
            )}
            {personB?.education && (
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-dim)" }}>Education:</span>
                <b>{personB.education}</b>
              </div>
            )}
            {personB?.career && (
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-dim)" }}>Profession:</span>
                <b>{personB.career}</b>
              </div>
            )}

            {/* Values Tags */}
            {Array.isArray(personB?.values) && personB.values.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase" }}>Core Values:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {personB.values.map((v: string) => (
                    <span key={v} style={{ fontSize: "11px", background: "rgba(228,189,117,0.12)", color: "var(--gold-primary)", padding: "2px 8px", borderRadius: "12px" }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Tags */}
            {Array.isArray(personB?.lifestyle) && personB.lifestyle.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase" }}>Lifestyle:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {personB.lifestyle.map((l: string) => (
                    <span key={l} style={{ fontSize: "11px", background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: "12px" }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Media & Private Storage Assets */}
      <div className="panel" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <span className="step-label">SECURE MEDIA ASSETS</span>
            <h2 style={{ fontSize: "20px" }}>Uploaded Photos & Jataka Documents ({allUploads.length})</h2>
          </div>
          <span style={{ fontSize: "12px", color: "var(--gold-primary)", background: "rgba(228,189,117,0.1)", padding: "4px 10px", borderRadius: "6px" }}>
            Max allowed: 500 MB per file
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Direct inspection of Profile Photos, Hand/Palmistry scans, and Kundli/Jataka charts submitted by this couple.
        </p>
        <AdminUploadViewer uploads={allUploads} />
      </div>

      {/* Compatibility Evaluation Breakdown */}
      <div className="panel" style={{ marginTop: "24px" }}>
        <span className="step-label">DETERMINISTIC COMPATIBILITY MODEL</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", margin: "6px 0 16px" }}>
          <h2 style={{ fontSize: "22px" }}>Overall Score:</h2>
          <span style={{ fontSize: "36px", fontWeight: 800, color: "var(--gold-primary)" }}>
            {compat?.overall_score ?? "—"}%
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          <div style={{ background: "#080e1a", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Values (25%)</span>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--gold-primary)", margin: "4px 0 0" }}>{compat?.values_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Relationship (15%)</span>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--gold-primary)", margin: "4px 0 0" }}>{compat?.relationship_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Lifestyle (15%)</span>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--gold-primary)", margin: "4px 0 0" }}>{compat?.lifestyle_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Career (15%)</span>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--gold-primary)", margin: "4px 0 0" }}>{compat?.career_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Age Harmony (15%)</span>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--gold-primary)", margin: "4px 0 0" }}>{compat?.age_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Location (10%)</span>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--gold-primary)", margin: "4px 0 0" }}>{compat?.location_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Education (5%)</span>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--gold-primary)", margin: "4px 0 0" }}>{compat?.education_score ?? "—"}%</p>
          </div>
        </div>
      </div>

      {/* Numerology Archetypes */}
      {numerology?.reading_data && (
        <div className="panel" style={{ marginTop: "24px" }}>
          <span className="step-label">TRADITIONAL NUMEROLOGY PROFILES</span>
          <h2 style={{ fontSize: "20px", margin: "6px 0 16px" }}>Numbers & Harmony Dynamic</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#080e1a", padding: "14px", borderRadius: "8px" }}>
              <b>{personA?.name}</b>: Life Path <b>{numerology.reading_data.personA?.lifePath}</b> · Name Number <b>{numerology.reading_data.personA?.nameNumber}</b>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>{numerology.reading_data.personA?.meaning}</p>
            </div>
            <div style={{ background: "#080e1a", padding: "14px", borderRadius: "8px" }}>
              <b>{personB?.name}</b>: Life Path <b>{numerology.reading_data.personB?.lifePath}</b> · Name Number <b>{numerology.reading_data.personB?.nameNumber}</b>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>{numerology.reading_data.personB?.meaning}</p>
            </div>
          </div>
          {numerology.reading_data.compatibility?.dynamics && (
            <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--gold-hover)" }}>
              ✦ Dynamic: {numerology.reading_data.compatibility.dynamics}
            </p>
          )}
        </div>
      )}

      {/* AI Kundli & Traditional Insights */}
      {jataka?.reading_data?.insights && (
        <div className="panel" style={{ marginTop: "24px" }}>
          <span className="step-label">KUNDLI & JATAKA LORE</span>
          <h2 style={{ fontSize: "20px", margin: "6px 0 14px" }}>Traditional Astrology Observations</h2>
          <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--text-main)", lineHeight: 1.7 }}>
            {(Array.isArray(jataka.reading_data.insights) ? jataka.reading_data.insights : [jataka.reading_data.insights]).map((item: any, i: number) => (
              <li key={i} style={{ marginBottom: "6px" }}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Palmistry Insights */}
      {palm?.reading_data?.insights && (
        <div className="panel" style={{ marginTop: "24px" }}>
          <span className="step-label">PALMISTRY INTERPRETATION</span>
          <h2 style={{ fontSize: "20px", margin: "6px 0 14px" }}>Hand Observations</h2>
          <p style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: 1.7 }}>
            {Array.isArray(palm.reading_data.insights) ? palm.reading_data.insights.join(" · ") : JSON.stringify(palm.reading_data.insights)}
          </p>
        </div>
      )}

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
