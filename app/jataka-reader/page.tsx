"use client";

import { useState, useRef } from "react";

export default function JatakaReaderPage() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [tob, setTob] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPath, setUploadedPath] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!consent) {
      setError("Please check the consent confirmation before selecting a document.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);

    // Upload immediately to private storage
    const jatakaAnalysisId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-0000-0000-000000000000";
    const formData = new FormData();
    formData.append("file", selected);
    formData.append("kind", "jataka-standalone");
    formData.append("analysisId", jatakaAnalysisId);
    formData.append("consent", "true");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadedPath(data.path);
    } catch (err: any) {
      setError(err.message || "Could not upload document");
    }
  };

  const runAnalysis = async () => {
    setError("");
    if (!consent) {
      setError("Please confirm consent before analyzing.");
      return;
    }
    if (!file && !uploadedPath) {
      setError("Please attach a Jataka / Kundli chart file (PDF or Image).");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/jataka/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentPath: uploadedPath || "mock-path-jataka.pdf",
          name: name || "Individual",
          dob,
          tob,
          birthPlace,
          consent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setReading(data.reading);
    } catch (err: any) {
      setError(err.message || "Failed to process Jataka document.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/">Couple Compatibility</a>
          <a href="/history">History</a>
          <a href="/privacy">Privacy</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 30px" }}>
        <p className="eyebrow">STANDALONE AI CHART READER</p>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 54px)" }}>
          Read Your <i>Jataka / Kundli</i>
        </h1>
        <p className="lead">
          Upload an existing birth chart document (PDF or image). Our AI document reader extracts legible traditional structures and provides a structured cultural reflection.
        </p>
      </div>

      <div className="disclaimer-box">
        <b>Ethical Reading Notice:</b> Yugma AI does not invent planetary degrees or unreadable chart positions. If exact calculations are unavailable, we explicitly distinguish between visible chart markers and cultural interpretations.
      </div>

      <section className="panel" style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div className="panel-header">
          <span className="step-label">CHART UPLOAD</span>
          <h2>Provide Details & Document</h2>
        </div>

        <div className="fields-grid">
          <div className="form-group span-2">
            <label>Name or Chart Subject</label>
            <input
              type="text"
              placeholder="e.g. Priyanshu"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Date of Birth <em>optional</em></label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Time of Birth <em>optional</em></label>
            <input
              type="time"
              value={tob}
              onChange={(e) => setTob(e.target.value)}
            />
          </div>

          <div className="form-group span-2">
            <label>Birth Place <em>optional</em></label>
            <input
              type="text"
              placeholder="City, State / Country"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
            />
          </div>
        </div>

        {/* Consent First */}
        <div className="consent-box" style={{ marginTop: "20px" }}>
          <label className="consent-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I confirm that I have permission to submit this chart document, and I agree to the <a href="/privacy">Privacy Policy</a>.
            </span>
          </label>
        </div>

        {/* File Dropzone */}
        <div style={{ marginTop: "18px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
            Jataka / Kundli Document (PDF, JPG, PNG, WEBP — Max 5MB)
          </label>

          <div
            className={`upload-tile ${file ? "uploaded" : ""}`}
            style={{ padding: "30px 20px" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="icon" style={{ fontSize: "32px" }}>📜</span>
            <p className="name" style={{ fontSize: "14px" }}>
              {file ? file.name : "Click to select Jataka / Kundli document"}
            </p>
            <p className="status" style={{ fontSize: "12px", marginTop: "4px" }}>
              {uploadedPath ? "Uploaded securely to private storage ✓" : "Encrypted transport · Private storage"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {error && <p className="error-text">⚠ {error}</p>}

        <div style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={runAnalysis}
            disabled={busy || !consent || (!file && !uploadedPath)}
            style={{ width: "100%" }}
          >
            {busy ? (
              <>
                <div className="spinner" />
                <span>Extracting Chart Information with Gemini AI…</span>
              </>
            ) : (
              <span>Analyze Jataka Document ✦</span>
            )}
          </button>
        </div>
      </section>

      {/* Reading Result */}
      {reading && (
        <section style={{ marginTop: "40px" }}>
          <div className="panel" style={{ borderColor: "var(--border-active)" }}>
            <span className="step-label">INTERPRETATION REPORT</span>
            <h2 style={{ fontSize: "26px", color: "var(--text-main)", margin: "8px 0 16px" }}>
              Chart Overview & Summary
            </h2>
            <p style={{ color: "var(--gold-hover)", fontSize: "15px", marginBottom: "16px" }}>
              {reading.chartSummary}
            </p>

            <div className="disclaimer-box">{reading.disclaimer}</div>

            <div className="insights-grid">
              <div className="insight-card">
                <h3>✦ Visible Chart Information</h3>
                <ul>
                  {reading.clearlyVisibleInfo?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-card">
                <h3>✦ Traditional Interpretation</h3>
                <p>{reading.traditionalInterpretation}</p>
              </div>

              <div className="insight-card">
                <h3>✦ Relationship Themes</h3>
                <ul>
                  {reading.relationshipThemes?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-card">
                <h3>✦ Career & Vocational Themes</h3>
                <ul>
                  {reading.careerThemes?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-card">
                <h3>✦ Areas to Reflect Upon</h3>
                <ul>
                  {reading.areasToReflectOn?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-card">
                <h3>✦ Questions for Further Exploration</h3>
                <ul>
                  {reading.questionsForExploration?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/data-controls">Data Controls</a>
        </div>
      </footer>
    </main>
  );
}
