"use client";

import { useEffect, useState, useRef } from "react";
import type { PersonProfile } from "@/lib/calculations/compatibility";

const PRESET_CHOICES = {
  values: ["Trust & Loyalty", "Family Bond", "Ambition & Growth", "Kindness", "Independence", "Spiritual Depth", "Open Communication"],
  lifestyle: ["Active Fitness", "Travel & Adventure", "Quiet Home Life", "Reading & Arts", "Social Gatherings", "Outdoor Nature"],
  goals: ["Marriage", "Long-term relationship", "Life companionship", "Dating / explore"],
};

type FormPerson = PersonProfile & {
  profilePhotoPath?: string;
  handPhotoPath?: string;
  jatakaPath?: string;
};

const initialPerson = (gender: PersonProfile["gender"]): FormPerson => ({
  name: "",
  gender,
  dob: "",
  tob: "",
  birthPlace: "",
  city: "",
  education: "",
  career: "",
  relationshipGoal: "Marriage",
  careerGoal: "Continuous growth & work-life harmony",
  values: ["Trust & Loyalty", "Family Bond"],
  lifestyle: ["Travel & Adventure", "Quiet Home Life"],
  profilePhotoPath: "",
  handPhotoPath: "",
  jatakaPath: "",
});

export default function HomePage() {
  const [personA, setPersonA] = useState<FormPerson>(initialPerson("male"));
  const [personB, setPersonB] = useState<FormPerson>(initialPerson("female"));
  const [modules, setModules] = useState<string[]>([
    "compatibility",
    "jataka",
    "numerology",
    "palm",
    "career",
    "relationship",
  ]);
  const [consent, setConsent] = useState(false);
  const [remaining, setRemaining] = useState<number>(5);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [stageText, setStageText] = useState("");
  const [error, setError] = useState("");
  const [signupPrompt, setSignupPrompt] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Initialize draft analysis & fetch remaining free readings
  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      })
      .catch(() => undefined);

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
    if (!consent) {
      setError("Please confirm consent below before uploading personal files or images.");
      return;
    }

    const uploadKind = `person-${personKey.toLowerCase()}-${kind}`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("analysisId", analysisId || "default-draft");
    formData.append("kind", uploadKind);
    formData.append("consent", "true");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

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
    }
  };

  const runAnalysis = async () => {
    setError("");
    if (!consent) {
      setError("Please confirm consent before continuing.");
      return;
    }
    if (!personA.name || !personA.dob || !personA.birthPlace) {
      setError("Please complete all required fields for Person A (Name, Date of Birth, Birth Place).");
      return;
    }
    if (!personB.name || !personB.dob || !personB.birthPlace) {
      setError("Please complete all required fields for Person B (Name, Date of Birth, Birth Place).");
      return;
    }

    setBusy(true);
    setSignupPrompt(false);
    setStageText("Reviewing relationship information…");

    const timer1 = setTimeout(() => setStageText("Comparing compatibility factors & values…"), 900);
    const timer2 = setTimeout(() => setStageText("Generating AI cultural interpretation & report…"), 2000);

    try {
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personA,
          personB,
          modules,
          consent: true,
          analysisId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.signupRequired) {
          setSignupPrompt(true);
        }
        throw new Error(json.error || "Could not generate analysis.");
      }

      setResult(json);
      if (typeof json.remaining === "number") {
        setRemaining(json.remaining);
      }

      // Scroll to report smoothly
      setTimeout(() => {
        document.getElementById("results-view")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setBusy(false);
      setStageText("");
    }
  };

  return (
    <main>
      {/* Navigation */}
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
          <span className="tag">BETA</span>
        </a>
        <div className="nav-links">
          <a href="/jataka-reader">Jataka Reader</a>
          <a href="/history">History</a>
          <a href="/privacy">Privacy</a>
          <a href="/login" className="nav-btn">Sign In</a>
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
            Start Free Reading <span>→</span>
          </a>
          <a href="/jataka-reader" className="btn-secondary">
            Upload Single Jataka Chart
          </a>
          <div className="allowance-badge">
            ✦ Free readings remaining: <b>{remaining}</b>
          </div>
        </div>
      </header>

      {/* Trust & Ethics Disclaimer Bar */}
      <section className="trust-bar">
        <div>
          <b>Your information is protected.</b>
          <p>We use secure transport, private storage, and strict access controls. Your insights are yours to explore.</p>
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
            title="PERSON A"
            person={personA}
            update={setPersonA}
            onUpload={(kind, file) => handleFileUpload("A", kind, file)}
          />

          {/* PERSON B */}
          <PersonSection
            title="PERSON B"
            person={personB}
            update={setPersonB}
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

          {signupPrompt && (
            <div className="disclaimer-box" style={{ borderColor: "#f39c12", margin: "16px 0" }}>
              <p style={{ fontWeight: 600, color: "#f39c12" }}>Your free readings are complete.</p>
              <p style={{ marginTop: "6px" }}>
                Create your free account to continue saving analyses and accessing deeper compatibility readings.
              </p>
              <a href="/signup" className="btn-primary" style={{ marginTop: "12px", display: "inline-block" }}>
                Create Free Account →
              </a>
            </div>
          )}

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
  title,
  person,
  update,
  onUpload,
}: {
  title: "PERSON A" | "PERSON B";
  person: FormPerson;
  update: React.Dispatch<React.SetStateAction<FormPerson>>;
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
          <label>Date of Birth *</label>
          <input
            type="date"
            required
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
          <label>Birth Place *</label>
          <input
            type="text"
            required
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
      <div className="upload-group">
        <p className="upload-title">Optional Media & Charts</p>
        <div className="upload-grid">
          {/* Profile Photo */}
          <div
            className={`upload-tile ${person.profilePhotoPath ? "uploaded" : ""}`}
            onClick={() => profileRef.current?.click()}
          >
            <span className="icon">📷</span>
            <p className="name">Profile Photo</p>
            <p className="status">{person.profilePhotoPath ? "Uploaded ✓" : "Tap to add"}</p>
            <input
              ref={profileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && onUpload("profile", e.target.files[0])}
            />
          </div>

          {/* Palm/Hand Photo */}
          <div
            className={`upload-tile ${person.handPhotoPath ? "uploaded" : ""}`}
            onClick={() => handRef.current?.click()}
          >
            <span className="icon">✋</span>
            <p className="name">Hand / Palm</p>
            <p className="status">{person.handPhotoPath ? "Uploaded ✓" : "For palmistry"}</p>
            <input
              ref={handRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && onUpload("hand", e.target.files[0])}
            />
          </div>

          {/* Jataka Document */}
          <div
            className={`upload-tile ${person.jatakaPath ? "uploaded" : ""}`}
            onClick={() => jatakaRef.current?.click()}
          >
            <span className="icon">📜</span>
            <p className="name">Jataka / Kundli</p>
            <p className="status">{person.jatakaPath ? "Attached ✓" : "PDF or Image"}</p>
            <input
              ref={jatakaRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && onUpload("jataka", e.target.files[0])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
