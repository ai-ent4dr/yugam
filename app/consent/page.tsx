export default function ConsentPage() {
  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">ETHICAL SUBMISSION GUIDELINES</p>
        <h1 style={{ fontSize: "36px" }}>Consent & Information Standards</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          Clear expectations for providing information regarding yourself and a partner.
        </p>
      </div>

      <div className="panel" style={{ maxWidth: "800px" }}>
        <h2 style={{ fontSize: "20px", color: "var(--gold-primary)", marginBottom: "14px" }}>
          Submission Authority Requirement
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "14px" }}>
          Before submitting names, birth data, photos, or astrological charts for Person A and Person B, you must verify that you possess explicit authorization or permission from each individual to input their personal data into Yugma AI.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "14px" }}>
          <b>Key Ethical Principles:</b>
        </p>
        <ul style={{ paddingLeft: "20px", color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.8" }}>
          <li><b>No Non-Consensual Analysis:</b> Do not submit information of individuals who have explicitly requested not to be included in digital evaluations.</li>
          <li><b>Private Storage:</b> All uploaded photos and Kundli documents are deposited directly into private storage accessible only by authenticated session owners and authorized platform operators.</li>
          <li><b>No Facial Scoring:</b> We strictly prohibit and refuse facial attractiveness scoring, beauty evaluations, or physical appearance profiling.</li>
          <li><b>Interpretive Purpose:</b> Traditional astrology, numerology, and palmistry interpretations are cultural frameworks intended for personal reflection, mutual understanding, and entertainment—not scientific truth or deterministic life predictions.</li>
        </ul>

        <div style={{ marginTop: "24px" }}>
          <a href="/" className="btn-primary">
            Return to Reading Form →
          </a>
        </div>
      </div>

      <footer>
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
