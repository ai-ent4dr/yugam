import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { localAnalysisStore } from "@/lib/analysis-store";
import { REPORT_DISCLAIMER } from "@/lib/ai/prompts";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser().catch(() => null);

  let record: any = null;

  // 1. Check local store
  if (localAnalysisStore.has(id)) {
    record = localAnalysisStore.get(id);
  }

  // 2. Check Database
  if (!record) {
    try {
      const adminDb = createAdminClient();
      const { data, error } = await adminDb
        .from("analyses")
        .select(
          `
          id,
          status,
          created_at,
          analysis_type,
          owner_user_id,
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

      if (!error && data) {
        // Map database record to display structure
        const compat = Array.isArray(data.compatibility_results)
          ? data.compatibility_results[0]
          : data.compatibility_results;
        const peopleA = (data.analysis_people || []).find((p: any) => p.person_role === "A");
        const peopleB = (data.analysis_people || []).find((p: any) => p.person_role === "B");
        const jataka = Array.isArray(data.jataka_readings) ? data.jataka_readings[0] : data.jataka_readings;
        const num = Array.isArray(data.numerology_readings) ? data.numerology_readings[0] : data.numerology_readings;
        const palm = Array.isArray(data.palm_readings) ? data.palm_readings[0] : data.palm_readings;
        const future = Array.isArray(data.future_readings) ? data.future_readings[0] : data.future_readings;

        record = {
          id: data.id,
          createdAt: data.created_at,
          personA: peopleA || { name: "Person A" },
          personB: peopleB || { name: "Person B" },
          match: {
            score: compat?.overall_score ?? 75,
            label: "Yugma Compatibility Estimate",
            breakdown: {
              values: compat?.values_score ?? 80,
              relationshipGoals: compat?.relationship_score ?? 85,
              lifestyle: compat?.lifestyle_score ?? 70,
              careerGoals: compat?.career_score ?? 75,
              ageCompatibility: compat?.age_score ?? 80,
              location: compat?.location_score ?? 70,
              educationInterests: compat?.education_score ?? 75,
            },
            summary: compat?.explanation?.summary || "Comprehensive compatibility evaluation.",
            strengths: compat?.explanation?.strengths || [],
            challenges: compat?.explanation?.challenges || [],
            practicalSuggestions: compat?.explanation?.practicalSuggestions || [],
          },
          aiReport: {
            compatibility: {
              overview: "Balanced interplay between shared priorities and individual growth.",
              strengths: compat?.explanation?.strengths || [],
              challenges: compat?.explanation?.challenges || [],
            },
            careerInsights: future?.reading_data?.careerInsights || [],
            jatakaInsights: jataka?.reading_data?.insights || [],
            uploadedJatakaInsights: jataka?.reading_data?.uploaded || [],
            numerologyInsights: num?.reading_data?.insights || [],
            palmistryInsights: palm?.reading_data?.insights || [],
            futureThemes: future?.reading_data?.futureThemes || [],
            practicalSuggestions: compat?.explanation?.practicalSuggestions || [],
          },
        };
      }
    } catch {
      // Local dev fallback
    }
  }

  if (!record) {
    notFound();
  }

  const { personA, personB, match, aiReport, createdAt } = record;

  return (
    <main>
      {/* Navigation */}
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/history">History</a>
          <a href="/account">Account</a>
          <a href="/" className="nav-btn">New Reading +</a>
        </div>
      </nav>

      {/* Report Header */}
      <div className="report-hero">
        <p className="eyebrow">SAVED COMPATIBILITY REPORT · {new Date(createdAt || Date.now()).toLocaleDateString()}</p>
        <h1 style={{ fontSize: "32px", fontWeight: 700, margin: "8px 0" }}>
          {personA?.name || "Person A"} & {personB?.name || "Person B"}
        </h1>
        <div className="score-display">
          <span className="score-number">{match.score}%</span>
          <span className="score-label">{match.label || "Yugma Compatibility Estimate"}</span>
        </div>
        <p style={{ maxWidth: "640px", margin: "10px auto 0", color: "var(--text-muted)" }}>
          {match.summary}
        </p>
      </div>

      <div className="disclaimer-box">{REPORT_DISCLAIMER}</div>

      {/* Component Factor Breakdown */}
      <div className="panel">
        <h2 style={{ fontSize: "20px", color: "var(--gold-primary)", marginBottom: "18px" }}>
          Compatibility Component Breakdown
        </h2>
        <div className="breakdown-bars">
          {Object.entries(match.breakdown || {}).map(([key, val]) => (
            <div className="bar-row" key={key}>
              <span className="label">
                {key.replace(/([A-Z])/g, " $1").toLowerCase()}
              </span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${val}%` }} />
              </div>
              <span className="val">{String(val)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Reading Sections */}
      <div className="insights-grid">
        {/* Relationship Dynamics & Strengths */}
        <div className="insight-card">
          <h3>✦ Relationship Dynamics & Strengths</h3>
          <p style={{ marginBottom: "12px" }}>
            {aiReport?.compatibility?.overview || "Shared values provide a solid anchor for long-term connection."}
          </p>
          <ul>
            {(aiReport?.compatibility?.strengths || match.strengths || []).map((s: string, idx: number) => (
              <li key={idx}><b>Strength:</b> {s}</li>
            ))}
          </ul>
        </div>

        {/* Growth Areas & Suggestions */}
        <div className="insight-card">
          <h3>✦ Areas to Discuss & Practical Suggestions</h3>
          <ul>
            {(aiReport?.compatibility?.challenges || match.challenges || []).map((c: string, idx: number) => (
              <li key={idx}><b>Point to Explore:</b> {c}</li>
            ))}
            {(aiReport?.practicalSuggestions || match.practicalSuggestions || []).map((p: string, idx: number) => (
              <li key={`p-${idx}`}><b>Suggestion:</b> {p}</li>
            ))}
          </ul>
        </div>

        {/* Career & Future Goals */}
        {aiReport?.careerInsights?.length > 0 && (
          <div className="insight-card">
            <h3>✦ Career & Future Goal Alignment</h3>
            <ul>
              {aiReport.careerInsights.map((ci: string, idx: number) => (
                <li key={idx}>{ci}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Numerology */}
        {aiReport?.numerologyInsights?.length > 0 && (
          <div className="insight-card">
            <h3>✦ Numerology-Style Harmony</h3>
            <ul>
              {aiReport.numerologyInsights.map((ni: string, idx: number) => (
                <li key={idx}>{ni}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Jataka Interpretation */}
        {aiReport?.jatakaInsights?.length > 0 && (
          <div className="insight-card">
            <h3>✦ Jataka-Style Interpretation</h3>
            <ul>
              {aiReport.jatakaInsights.map((ji: string, idx: number) => (
                <li key={idx}>{ji}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Uploaded Chart */}
        {aiReport?.uploadedJatakaInsights?.length > 0 && (
          <div className="insight-card">
            <h3>✦ Uploaded Chart Observations</h3>
            <ul>
              {aiReport.uploadedJatakaInsights.map((uj: string, idx: number) => (
                <li key={idx}>{uj}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Palmistry */}
        {aiReport?.palmistryInsights?.length > 0 && (
          <div className="insight-card">
            <h3>✦ Palmistry-Style Reading</h3>
            <ul>
              {aiReport.palmistryInsights.map((pi: string, idx: number) => (
                <li key={idx}>{pi}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Future Themes */}
        {aiReport?.futureThemes?.length > 0 && (
          <div className="insight-card">
            <h3>✦ Future & Life Planning Themes</h3>
            <ul>
              {aiReport.futureThemes.map((ft: string, idx: number) => (
                <li key={idx}>{ft}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <footer style={{ marginTop: "60px" }}>
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/data-controls">Data Controls</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </footer>
    </main>
  );
}
