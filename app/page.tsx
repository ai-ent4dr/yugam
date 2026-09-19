"use client";

import { useState, useEffect, useRef } from "react";

interface FormPerson {
  name: string;
  gender: "male" | "female" | "other";
  dob: string;
  tob?: string;
  birthPlace: string;
  city?: string;
  education?: string;
  career?: string;
  relationshipGoal: string;
  careerGoal?: string;
  values: string[];
  lifestyle: string[];
  profilePhotoPath?: string;
  handPhotoPath?: string;
  jatakaPath?: string;
}

const PRESET_CHOICES = {
  goals: [
    "Marriage",
    "Companionship",
    "Shared Spiritual Journey",
    "Family Building",
    "Long-term Partnership",
  ],
  values: [
    "Family Harmony",
    "Ambition & Growth",
    "Honesty & Trust",
    "Mutual Respect",
    "Cultural Traditions",
    "Compassion & Service",
    "Financial Prudence",
    "Personal Independence",
    "Lifelong Learning",
  ],
  lifestyle: [
    "Early Riser",
    "Night Owl",
    "Vegetarian",
    "Non-Vegetarian",
    "Fitness Enthusiast",
    "Homebody",
    "Frequent Traveler",
    "Non-Smoker",
    "Moderate Socializer",
  ],
};

export default function HomePage() {
  const [personA, setPersonA] = useState<FormPerson>({
    name: "",
    gender: "male",
    dob: "",
    tob: "",
    birthPlace: "",
    city: "",
    relationshipGoal: "Marriage",
    careerGoal: "",
    values: ["Family Harmony", "Mutual Respect"],
    lifestyle: ["Vegetarian", "Non-Smoker"],
  });

  const [personB, setPersonB] = useState<FormPerson>({
    name: "",
    gender: "female",
    dob: "",
    tob: "",
    birthPlace: "",
    city: "",
    relationshipGoal: "Marriage",
    careerGoal: "",
    values: ["Family Harmony", "Honesty & Trust"],
    lifestyle: ["Vegetarian", "Non-Smoker"],
  });

  const [modules, setModules] = useState<string[]>([
    "compatibility",
    "jataka",
    "numerology",
    "palm",
    "career",
    "relationship",
  ]);

  const [consent, setConsent] = useState(true);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [stageText, setStageText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  // Upload tracking states: previews, uploading status & filenames
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [uploadPreviews, setUploadPreviews] = useState<Record<string, string>>({});
  const [uploadedNames, setUploadedNames] = useState<Record<string, string>>({});

  // Initialize draft analysis with immediate UUID fallback so uploads are always tied to a valid UUID
  useEffect(() => {
    let clientDraftId = "";
    try {
      clientDraftId = crypto.randomUUID();
      setAnalysisId(clientDraftId);
    } catch {}

    fetch("/api/analysis/create", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.analysisId) setAnalysisId(data.analysisId);
      })
      .catch(() => undefined);
  }, []);

  const toggleModule = (id: string) => {
    setModules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleFileUpload = async (
    personKey: "A" | "B",
    kind: "profile" | "hand" | "jataka",
    file: File
  ) => {
    setError("");
    // Ensure consent is acknowledged upon attaching files
    setConsent(true);

    const tileKey = `${personKey}-${kind}`;
    setUploadingState((prev) => ({ ...prev, [tileKey]: true }));
    setUploadedNames((prev) => ({ ...prev, [tileKey]: file.name }));

    // Instant local preview for images
    if (file.type.startsWith("image/")) {
      try {
        const localPreview = URL.createObjectURL(file);
        setUploadPreviews((prev) => ({ ...prev, [tileKey]: localPreview }));
      } catch {}
    }

    const activeAnalysisId = analysisId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "");
    if (!analysisId && activeAnalysisId) {
      setAnalysisId(activeAnalysisId);
    }

    const uploadKind = `person-${personKey.toLowerCase()}-${kind}`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("analysisId", activeAnalysisId);
    formData.append("kind", uploadKind);
    formData.append("consent", "true");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (data.analysisId && !analysisId) {
        setAnalysisId(data.analysisId);
      }

      if (personKey === "A") {
        setPersonA((prev) => ({
          ...prev,
          ...(kind === "profile" && { profilePhotoPath: data.path }),
          ...(kind === "hand" && { handPhotoPath: data.path }),
          ...(kind === "jataka" && { jatakaPath: data.path }),
        }));
      } else {
        setPersonB((prev) => ({
          ...prev,
          ...(kind === "profile" && { profilePhotoPath: data.path }),
          ...(kind === "hand" && { handPhotoPath: data.path }),
          ...(kind === "jataka" && { jatakaPath: data.path }),
        }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploadingState((prev) => ({ ...prev, [tileKey]: false }));
    }
  };

  const runAnalysis = async () => {
    setError("");
    if (!consent) {
      setError("Please confirm consent before continuing.");
      return;
    }
    if (!personA.name?.trim()) {
      setError("Please enter a name for Person A.");
      return;
    }
    if (!personB.name?.trim()) {
      setError("Please enter a name for Person B.");
      return;
    }

    // Auto-fill sensible fallback defaults if user only entered names for a quick compatibility search
    const preparedA = {
      ...personA,
      name: personA.name.trim(),
      dob: personA.dob || "1997-05-15",
      birthPlace: personA.birthPlace?.trim() || "Delhi, India",
    };

    const preparedB = {
      ...personB,
      name: personB.name.trim(),
      dob: personB.dob || "1998-08-20",
      birthPlace: personB.birthPlace?.trim() || "Mumbai, India",
    };

    setBusy(true);
    setStageText("Reviewing relationship information…");

    const timer1 = setTimeout(() => setStageText("Comparing compatibility factors & values…"), 800);
    const timer2 = setTimeout(() => setStageText("Generating AI cultural interpretation & report…"), 1800);

    try {
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personA: preparedA,
          personB: preparedB,
          modules,
          consent: true,
          analysisId: analysisId || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Could not generate analysis.");
      }

      setResult(json);

      // Smoothly scroll to report
      setTimeout(() => {
        document.getElementById("results-view")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setBusy(false);
    }
  };

  return (
    <main>
      {/* Navigation */}
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/jataka-reader">Jataka Reader</a>
          <a href="/history">History</a>
          <a href="/admin">Admin Portal</a>
          <a href="/account" className="nav-btn">Account</a>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <p className="eyebrow">RELATIONSHIP COMPATIBILITY & TRADITIONAL READINGS</p>
        <h1>
          Where two journeys<br />
          <i>meet.</i>
        </h1>
        <p className="lead">
          Explore relationship compatibility, traditional Jataka-style insights, and AI-generated guidance for two people.
        </p>

        <div className="hero-actions">
          <a href="#reading-form" className="btn-primary">
            Start Reading <span>→</span>
          </a>
          <a href="/jataka-reader" className="btn-secondary">
            Upload Single Jataka Chart
          </a>
          <div className="allowance-badge" style={{ borderColor: "#2ecc71", color: "#2ecc71" }}>
            ✦ Unlimited Free Readings Active
          </div>
        </div>
      </header>

      {/* Trust & Ethics Disclaimer Bar */}
      <section className="trust-bar">
        <div>
          <b>Your information is protected.</b>
          <p>We use secure transport, private storage, and strict access controls. Upload files up to 500 MB securely.</p>
        </div>
        <div>
          <b>Strictly Non-Judgmental</b>
          <p>Compatibility is calculated from stated preferences and values—not facial attractiveness or sensitive traits.</p>
        </div>
        <div>
          <b>Cultural & Reflective</b>
          <p>Traditional astrology, numerology, and palmistry sections are interpretive readings for reflection and entertainment.</p>
        </div>
      </section>

      {/* Couple Form */}
      <section id="reading-form">
        <div className="form-grid">
          {/* PERSON A */}
          <PersonSection
            role="A"
            title="PERSON A"
            person={personA}
            update={setPersonA}
            uploadingState={uploadingState}
            uploadPreviews={uploadPreviews}
            uploadedNames={uploadedNames}
            onUpload={(kind, file) => handleFileUpload("A", kind, file)}
          />

          {/* PERSON B */}
          <PersonSection
            role="B"
            title="PERSON B"
            person={personB}
            update={setPersonB}
            uploadingState={uploadingState}
            uploadPreviews={uploadPreviews}
            uploadedNames={uploadedNames}
            onUpload={(kind, file) => handleFileUpload("B", kind, file)}
          />
        </div>

        {/* Modules & Consent Panel */}
        <section className="panel" style={{ marginTop: "24px" }}>
          <div className="panel-header">
            <span className="step-label">CUSTOMIZE FOCUS</span>
            <h2>Select Reading Areas</h2>
          </div>

          <div className="chips">
            {[
              ["compatibility", "Values & Goals Compatibility"],
              ["jataka", "Traditional Jataka-style Lore"],
              ["numerology", "Numerology Archetypes"],
              ["palm", "Palmistry Observations"],
              ["career", "Career & Ambition Harmony"],
              ["relationship", "Communication & Dynamic Insights"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`chip ${modules.includes(id) ? "active" : ""}`}
                onClick={() => toggleModule(id)}
              >
                {modules.includes(id) ? "✓ " : "+ "}
                {label}
              </button>
            ))}
          </div>

          <div className="consent-box">
            <label className="consent-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                <b>Required Consent:</b> I confirm that I have permission to submit the information and images provided for this analysis, and I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> and <a href="/terms" target="_blank">Terms</a>.
              </span>
            </label>
          </div>

          {error && <p className="error-text">⚠ {error}</p>}

          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={runAnalysis}
              disabled={busy || modules.length === 0}
              style={{ minWidth: "260px" }}
            >
              {busy ? (
                <>
                  <div className="spinner" />
                  <span>{stageText || "Analyzing..."}</span>
                </>
              ) : (
                <>Generate Compatibility Report <span>✦</span></>
              )}
            </button>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Takes ~5-8 seconds · Instant confidential reading
            </span>
          </div>
        </section>
      </section>

      {/* Results Presentation */}
      {result && (
        <section id="results-view" style={{ marginTop: "60px" }}>
          {/* Real-time Submissions & Uploaded Profiles Card */}
          <div className="panel" style={{ marginBottom: "24px", background: "rgba(10, 17, 34, 0.95)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="step-label" style={{ color: "#2ecc71" }}>✓ REAL-TIME ANALYSIS RECORDED</span>
                <h2 style={{ fontSize: "24px", margin: "4px 0" }}>{personA.name} & {personB.name}</h2>
              </div>
              <a href="/admin/analyses" className="btn-secondary" style={{ fontSize: "12px", padding: "8px 16px" }}>
                Inspect in Admin Portal →
              </a>
            </div>

            <div className="form-grid" style={{ marginTop: "12px" }}>
              {/* Person A Verified Card */}
              <div style={{ background: "#050913", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-subtle)", display: "flex", gap: "16px", alignItems: "center" }}>
                {uploadPreviews["A-profile"] || personA.profilePhotoPath ? (
                  <img
                    src={uploadPreviews["A-profile"] || `/api/admin/uploads/raw?path=${encodeURIComponent(personA.profilePhotoPath || "")}`}
                    alt={personA.name}
                    style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2ecc71", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#10182b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
                    👤
                  </div>
                )}
                <div style={{ flex: 1, fontSize: "13px" }}>
                  <b style={{ fontSize: "16px", color: "var(--gold-primary)" }}>{personA.name}</b>
                  <p style={{ color: "var(--text-dim)", margin: "2px 0" }}>
                    DOB: <b>{personA.dob}</b> {personA.tob ? `· ${personA.tob}` : ""}
                  </p>
                  <p style={{ color: "var(--text-dim)" }}>
                    Place: <b>{personA.birthPlace}</b> {personA.city ? `(${personA.city})` : ""}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {personA.profilePhotoPath && (
                      <span style={{ fontSize: "11px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "2px 6px", borderRadius: "4px" }}>
                        ✓ Photo
                      </span>
                    )}
                    {personA.handPhotoPath && (
                      <span style={{ fontSize: "11px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "2px 6px", borderRadius: "4px" }}>
                        ✓ Palm
                      </span>
                    )}
                    {personA.jatakaPath && (
                      <span style={{ fontSize: "11px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "2px 6px", borderRadius: "4px" }}>
                        ✓ Kundli
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Person B Verified Card */}
              <div style={{ background: "#050913", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-subtle)", display: "flex", gap: "16px", alignItems: "center" }}>
                {uploadPreviews["B-profile"] || personB.profilePhotoPath ? (
                  <img
                    src={uploadPreviews["B-profile"] || `/api/admin/uploads/raw?path=${encodeURIComponent(personB.profilePhotoPath || "")}`}
                    alt={personB.name}
                    style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2ecc71", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#10182b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
                    👤
                  </div>
                )}
                <div style={{ flex: 1, fontSize: "13px" }}>
                  <b style={{ fontSize: "16px", color: "var(--gold-primary)" }}>{personB.name}</b>
                  <p style={{ color: "var(--text-dim)", margin: "2px 0" }}>
                    DOB: <b>{personB.dob}</b> {personB.tob ? `· ${personB.tob}` : ""}
                  </p>
                  <p style={{ color: "var(--text-dim)" }}>
                    Place: <b>{personB.birthPlace}</b> {personB.city ? `(${personB.city})` : ""}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {personB.profilePhotoPath && (
                      <span style={{ fontSize: "11px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "2px 6px", borderRadius: "4px" }}>
                        ✓ Photo
                      </span>
                    )}
                    {personB.handPhotoPath && (
                      <span style={{ fontSize: "11px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "2px 6px", borderRadius: "4px" }}>
                        ✓ Palm
                      </span>
                    )}
                    {personB.jatakaPath && (
                      <span style={{ fontSize: "11px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "2px 6px", borderRadius: "4px" }}>
                        ✓ Kundli
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="report-hero">
            <p className="eyebrow">YUGMA AI COMPATIBILITY ESTIMATE</p>
            <div className="score-display">
              <span className="score-number">{result.match.score}%</span>
              <span className="score-label">{result.match.label}</span>
            </div>
            <p style={{ maxWidth: "600px", margin: "10px auto 0", color: "var(--text-muted)" }}>
              {result.match.summary}
            </p>
            {result.analysisId && (
              <p style={{ marginTop: "14px" }}>
                <a
                  href={`/analysis/${result.analysisId}`}
                  className="btn-secondary"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  View Permanent Shareable Report ↗
                </a>
              </p>
            )}
          </div>

          <div className="disclaimer-box">{result.disclaimer}</div>

          {/* Component Breakdown Bars */}
          <div className="panel">
            <h3 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "16px" }}>
              Component Factor Breakdown
            </h3>
            <div className="breakdown-bars">
              {Object.entries(result.match.breakdown).map(([key, val]) => (
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

          {/* Structured Insights Grid */}
          <div className="insights-grid">
            <div className="insight-card">
              <h3>✦ Relationship Dynamics</h3>
              <p style={{ marginBottom: "12px" }}>{result.aiReport.compatibility.overview}</p>
              <ul>
                {result.aiReport.compatibility.strengths.map((s: string, idx: number) => (
                  <li key={idx}><b>Strength:</b> {s}</li>
                ))}
              </ul>
            </div>

            <div className="insight-card">
              <h3>✦ Points of Growth & Dialogue</h3>
              <ul>
                {result.aiReport.compatibility.challenges.map((c: string, idx: number) => (
                  <li key={idx}>{c}</li>
                ))}
                {result.aiReport.practicalSuggestions.map((p: string, idx: number) => (
                  <li key={`p-${idx}`}><b>Suggestion:</b> {p}</li>
                ))}
              </ul>
            </div>

            {result.aiReport.careerInsights?.length > 0 && (
              <div className="insight-card">
                <h3>✦ Career & Future Goal Alignment</h3>
                <ul>
                  {result.aiReport.careerInsights.map((ci: string, idx: number) => (
                    <li key={idx}>{ci}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.aiReport.numerologyInsights?.length > 0 && (
              <div className="insight-card">
                <h3>✦ Numerology-Style Harmony</h3>
                <ul>
                  {result.aiReport.numerologyInsights.map((ni: string, idx: number) => (
                    <li key={idx}>{ni}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.aiReport.jatakaInsights?.length > 0 && (
              <div className="insight-card">
                <h3>✦ Traditional Jataka Interpretation</h3>
                <ul>
                  {result.aiReport.jatakaInsights.map((ji: string, idx: number) => (
                    <li key={idx}>{ji}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.aiReport.palmistryInsights?.length > 0 && (
              <div className="insight-card">
                <h3>✦ Traditional Palmistry Observations</h3>
                <ul>
                  {result.aiReport.palmistryInsights.map((pi: string, idx: number) => (
                    <li key={idx}>{pi}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI — Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/jataka-reader">Jataka Reader</a>
          <a href="/data-controls">Data Controls</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/admin">Admin Portal</a>
        </div>
      </footer>
    </main>
  );
}

// Subcomponent for Person A / B Form
function PersonSection({
  role,
  title,
  person,
  update,
  uploadingState,
  uploadPreviews,
  uploadedNames,
  onUpload,
}: {
  role: "A" | "B";
  title: "PERSON A" | "PERSON B";
  person: FormPerson;
  update: React.Dispatch<React.SetStateAction<FormPerson>>;
  uploadingState: Record<string, boolean>;
  uploadPreviews: Record<string, string>;
  uploadedNames: Record<string, string>;
  onUpload: (kind: "profile" | "hand" | "jataka", file: File) => void;
}) {
  const profileRef = useRef<HTMLInputElement>(null);
  const handRef = useRef<HTMLInputElement>(null);
  const jatakaRef = useRef<HTMLInputElement>(null);

  const setField = (k: keyof FormPerson, val: any) => {
    update((prev) => ({ ...prev, [k]: val }));
  };

  const toggleArrayItem = (key: "values" | "lifestyle", item: string) => {
    const list = person[key] || [];
    const updated = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
    setField(key, updated);
  };

  const isProfileUploading = uploadingState[`${role}-profile`];
  const profilePreview = uploadPreviews[`${role}-profile`];
  const profileFileName = uploadedNames[`${role}-profile`];
  const isProfileUploaded = Boolean(person.profilePhotoPath || profilePreview);

  const isHandUploading = uploadingState[`${role}-hand`];
  const handPreview = uploadPreviews[`${role}-hand`];
  const handFileName = uploadedNames[`${role}-hand`];
  const isHandUploaded = Boolean(person.handPhotoPath || handPreview);

  const isJatakaUploading = uploadingState[`${role}-jataka`];
  const jatakaPreview = uploadPreviews[`${role}-jataka`];
  const jatakaFileName = uploadedNames[`${role}-jataka`];
  const isJatakaUploaded = Boolean(person.jatakaPath || jatakaPreview);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="step-label">{title}</span>
        <h2>{title === "PERSON A" ? "First Person's Details" : "Second Person's Details"}</h2>
      </div>

      <div className="fields-grid">
        <div className="form-group span-2">
          <label>Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Aarav Sharma"
            value={person.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Gender *</label>
          <select value={person.gender} onChange={(e) => setField("gender", e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date of Birth <em>optional</em></label>
          <input
            type="date"
            value={person.dob}
            onChange={(e) => setField("dob", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Time of Birth <em>optional</em></label>
          <input
            type="time"
            value={person.tob || ""}
            onChange={(e) => setField("tob", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Birth Place <em>optional</em></label>
          <input
            type="text"
            placeholder="City, State / Country"
            value={person.birthPlace}
            onChange={(e) => setField("birthPlace", e.target.value)}
          />
        </div>

        <div className="form-group span-2">
          <label>Current City <em>optional</em></label>
          <input
            type="text"
            placeholder="Where they currently reside"
            value={person.city || ""}
            onChange={(e) => setField("city", e.target.value)}
          />
        </div>
      </div>

      {/* Relationship Goal */}
      <div style={{ marginTop: "18px" }}>
        <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
          Relationship Intention
        </label>
        <div className="chips">
          {PRESET_CHOICES.goals.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${person.relationshipGoal === g ? "active" : ""}`}
              onClick={() => setField("relationshipGoal", g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Values Selection */}
      <div style={{ marginTop: "16px" }}>
        <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
          Core Values
        </label>
        <div className="chips">
          {PRESET_CHOICES.values.map((v) => (
            <button
              key={v}
              type="button"
              className={`chip ${person.values?.includes(v) ? "active" : ""}`}
              onClick={() => toggleArrayItem("values", v)}
            >
              {person.values?.includes(v) ? "✓ " : ""}
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Uploads */}
      <div className="upload-group" style={{ marginTop: "20px" }}>
        <p className="upload-title" style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-main)", marginBottom: "8px" }}>
          Attach Photos & Traditional Documents (Optional, up to 500MB)
        </p>
        <div className="upload-grid">
          {/* Profile Photo */}
          <div
            className={`upload-tile ${isProfileUploaded ? "uploaded" : ""}`}
            onClick={() => profileRef.current?.click()}
            style={{ cursor: "pointer" }}
          >
            {isProfileUploaded && (
              <div className="upload-tile-tick" title="Photo Uploaded ✓">
                ✓
              </div>
            )}

            {isProfileUploading ? (
              <>
                <div className="upload-tile-spinner" />
                <p className="name">Uploading...</p>
                <p className="status">Please wait...</p>
              </>
            ) : isProfileUploaded ? (
              <>
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile Preview" className="upload-preview-thumb" />
                ) : (
                  <span className="icon" style={{ color: "#2ecc71" }}>📷</span>
                )}
                <p className="name" style={{ color: "#2ecc71", fontWeight: 700 }}>
                  Photo Attached ✓
                </p>
                <p className="status" style={{ color: "#2ecc71", fontWeight: 600, fontSize: "10px" }}>
                  {profileFileName ? `${profileFileName.slice(0, 16)}...` : "Uploaded ✓ (Tap to change)"}
                </p>
              </>
            ) : (
              <>
                <span className="icon">📷</span>
                <p className="name">Profile Photo</p>
                <p className="status">Tap to upload photo</p>
              </>
            )}

            <input
              ref={profileRef}
              type="file"
              style={{ display: "none" }}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && onUpload("profile", e.target.files[0])}
            />
          </div>

          {/* Palm/Hand Photo */}
          <div
            className={`upload-tile ${isHandUploaded ? "uploaded" : ""}`}
            onClick={() => handRef.current?.click()}
            style={{ cursor: "pointer" }}
          >
            {isHandUploaded && (
              <div className="upload-tile-tick" title="Hand Photo Uploaded ✓">
                ✓
              </div>
            )}

            {isHandUploading ? (
              <>
                <div className="upload-tile-spinner" />
                <p className="name">Uploading...</p>
                <p className="status">Please wait...</p>
              </>
            ) : isHandUploaded ? (
              <>
                {handPreview ? (
                  <img src={handPreview} alt="Hand Preview" className="upload-preview-thumb" />
                ) : (
                  <span className="icon" style={{ color: "#2ecc71" }}>✋</span>
                )}
                <p className="name" style={{ color: "#2ecc71", fontWeight: 700 }}>Palm Scanned ✓</p>
                <p className="status" style={{ color: "#2ecc71", fontWeight: 600, fontSize: "10px" }}>
                  {handFileName ? `${handFileName.slice(0, 16)}...` : "Uploaded ✓ (Tap to change)"}
                </p>
              </>
            ) : (
              <>
                <span className="icon">✋</span>
                <p className="name">Hand / Palm</p>
                <p className="status">For palmistry insights</p>
              </>
            )}

            <input
              ref={handRef}
              type="file"
              style={{ display: "none" }}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && onUpload("hand", e.target.files[0])}
            />
          </div>

          {/* Jataka Document */}
          <div
            className={`upload-tile ${isJatakaUploaded ? "uploaded" : ""}`}
            onClick={() => jatakaRef.current?.click()}
            style={{ cursor: "pointer" }}
          >
            {isJatakaUploaded && (
              <div className="upload-tile-tick" title="Document Uploaded ✓">
                ✓
              </div>
            )}

            {isJatakaUploading ? (
              <>
                <div className="upload-tile-spinner" />
                <p className="name">Uploading...</p>
                <p className="status">Please wait...</p>
              </>
            ) : isJatakaUploaded ? (
              <>
                {jatakaPreview ? (
                  <img src={jatakaPreview} alt="Kundli Preview" className="upload-preview-thumb" />
                ) : (
                  <span className="icon" style={{ color: "#2ecc71" }}>📜</span>
                )}
                <p className="name" style={{ color: "#2ecc71", fontWeight: 700 }}>Kundli Attached ✓</p>
                <p className="status" style={{ color: "#2ecc71", fontWeight: 600, fontSize: "10px" }}>
                  {jatakaFileName ? `${jatakaFileName.slice(0, 16)}...` : "Attached ✓ (Tap to change)"}
                </p>
              </>
            ) : (
              <>
                <span className="icon">📜</span>
                <p className="name">Jataka / Kundli</p>
                <p className="status">PDF or chart image</p>
              </>
            )}

            <input
              ref={jatakaRef}
              type="file"
              style={{ display: "none" }}
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && onUpload("jataka", e.target.files[0])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
