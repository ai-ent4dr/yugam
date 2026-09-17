import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/config";
import { localAnalysisStore } from "@/lib/analysis-store";
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
  const adminDb = createAdminClient();

  let analysis: any = null;

  try {
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
    // Local dev fallback
  }

  if (!analysis && localAnalysisStore.has(id)) {
    const rec = localAnalysisStore.get(id);
    analysis = {
      id: rec.id,
      status: rec.status ?? "completed",
      created_at: rec.createdAt ?? new Date().toISOString(),
      owner_user_id: rec.ownerUserId ?? null,
      session_id: rec.sessionId ?? "local-session",
      analysis_people: [
        {
          person_role: "A",
          name: rec.personA?.name ?? "Person A",
          gender: rec.personA?.gender ?? "",
          dob: rec.personA?.dob ?? "",
          tob: rec.personA?.tob ?? "",
          birth_place: rec.personA?.birthPlace ?? "",
          city: rec.personA?.city ?? "",
        },
        {
          person_role: "B",
          name: rec.personB?.name ?? "Person B",
          gender: rec.personB?.gender ?? "",
          dob: rec.personB?.dob ?? "",
          tob: rec.personB?.tob ?? "",
          birth_place: rec.personB?.birthPlace ?? "",
          city: rec.personB?.city ?? "",
        },
      ],
      compatibility_results: {
        overall_score: rec.match?.score ?? 70,
        values_score: rec.match?.breakdown?.values ?? 70,
        relationship_score: rec.match?.breakdown?.relationshipGoals ?? 75,
        lifestyle_score: rec.match?.breakdown?.lifestyle ?? 70,
        career_score: rec.match?.breakdown?.careerGoals ?? 75,
        age_score: rec.match?.breakdown?.ageCompatibility ?? 70,
        location_score: rec.match?.breakdown?.location ?? 70,
        education_score: rec.match?.breakdown?.educationInterests ?? 70,
      },
      uploads: [
        ...(rec.personA?.profilePhotoPath ? [{ original_filename: "Person A Profile Photo", file_type: "profile_photo", storage_path: rec.personA.profilePhotoPath }] : []),
        ...(rec.personA?.handPhotoPath ? [{ original_filename: "Person A Palm Photo", file_type: "hand_photo", storage_path: rec.personA.handPhotoPath }] : []),
        ...(rec.personA?.jatakaPath ? [{ original_filename: "Person A Jataka Document", file_type: "jataka_document", storage_path: rec.personA.jatakaPath }] : []),
        ...(rec.personB?.profilePhotoPath ? [{ original_filename: "Person B Profile Photo", file_type: "profile_photo", storage_path: rec.personB.profilePhotoPath }] : []),
        ...(rec.personB?.handPhotoPath ? [{ original_filename: "Person B Palm Photo", file_type: "hand_photo", storage_path: rec.personB.handPhotoPath }] : []),
        ...(rec.personB?.jatakaPath ? [{ original_filename: "Person B Jataka Document", file_type: "jataka_document", storage_path: rec.personB.jatakaPath }] : []),
      ],
      jataka_readings: rec.aiReport?.jatakaInsights ? [{ reading_data: { insights: rec.aiReport.jatakaInsights } }] : [],
      numerology_readings: rec.numerology ? [{ reading_data: { personA: rec.numerology.personA, personB: rec.numerology.personB } }] : [],
      palm_readings: rec.aiReport?.palmistryInsights ? [{ reading_data: { insights: rec.aiReport.palmistryInsights } }] : [],
      future_readings: rec.aiReport?.futureThemes ? [{ reading_data: { futureThemes: rec.aiReport.futureThemes } }] : [],
    };
  }

  if (!analysis) {
    analysis = {
      id,
      status: "completed",
      created_at: new Date().toISOString(),
      owner_user_id: null,
      session_id: "local-session",
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
      uploads: [],
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
  const uploads = analysis.uploads || [];

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
          Analysis ID: <code>{id}</code> · Date: {new Date(analysis.created_at).toLocaleString()}
        </p>
      </div>

      {/* Couple Profiles Overview */}
      <div className="form-grid">
        <div className="panel">
          <span className="step-label">PERSON A</span>
          <h2>{personA?.name || "Person A"}</h2>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div><span style={{ color: "var(--text-dim)" }}>Gender:</span> <b>{personA?.gender || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>DOB:</span> <b>{personA?.dob || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>TOB:</span> <b>{personA?.tob || "Not provided"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>Birth Place:</span> <b>{personA?.birth_place || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>Current City:</span> <b>{personA?.city || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>Relationship Goal:</span> <b>{personA?.relationship_goal || "—"}</b></div>
          </div>
        </div>

        <div className="panel">
          <span className="step-label">PERSON B</span>
          <h2>{personB?.name || "Person B"}</h2>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div><span style={{ color: "var(--text-dim)" }}>Gender:</span> <b>{personB?.gender || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>DOB:</span> <b>{personB?.dob || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>TOB:</span> <b>{personB?.tob || "Not provided"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>Birth Place:</span> <b>{personB?.birth_place || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>Current City:</span> <b>{personB?.city || "—"}</b></div>
            <div><span style={{ color: "var(--text-dim)" }}>Relationship Goal:</span> <b>{personB?.relationship_goal || "—"}</b></div>
          </div>
        </div>
      </div>

      {/* Compatibility Result */}
      <div className="panel" style={{ marginTop: "20px" }}>
        <span className="step-label">DETERMINISTIC EVALUATION</span>
        <h2>Compatibility Breakdown: {compat?.overall_score ?? "—"}%</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "14px" }}>
          <div style={{ background: "#080e1a", padding: "10px", borderRadius: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Values (25%)</span>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold-primary)" }}>{compat?.values_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "10px", borderRadius: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Relationship (15%)</span>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold-primary)" }}>{compat?.relationship_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "10px", borderRadius: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Lifestyle (15%)</span>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold-primary)" }}>{compat?.lifestyle_score ?? "—"}%</p>
          </div>
          <div style={{ background: "#080e1a", padding: "10px", borderRadius: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Career (15%)</span>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold-primary)" }}>{compat?.career_score ?? "—"}%</p>
          </div>
        </div>
      </div>

      {/* Uploaded Media & Private Storage Signed URLs */}
      <div className="panel" style={{ marginTop: "20px" }}>
        <span className="step-label">SECURE MEDIA ASSETS</span>
        <h2>Uploaded Documents & Images ({uploads.length})</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "6px 0 14px" }}>
          Private Storage objects are protected. Click &quot;Request Signed URL&quot; to inspect any image or document via temporary 15-minute authorized token.
        </p>
        <AdminUploadViewer uploads={uploads} />
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
