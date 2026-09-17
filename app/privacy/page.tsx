export default function PrivacyPage() {
  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/terms">Terms of Service</a>
          <a href="/data-controls">Data Controls</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">TRANSPARENCY & DATA PROTECTION</p>
        <h1 style={{ fontSize: "36px" }}>Privacy Policy</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          Last updated: September 2026 · [Pending Final External Legal Review]
        </p>
      </div>

      <div className="panel" style={{ maxWidth: "820px" }}>
        <div className="disclaimer-box" style={{ margin: "0 0 24px" }}>
          <b>Notice:</b> This privacy policy describes the handling of personal information submitted to Yugma AI. Your information is protected using secure transport, private storage, and access controls. Your insights are yours to explore.
        </div>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            1. Information We Collect
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            When using Yugma AI, you may submit biographical and contextual information for two people: full names, gender identity, date of birth, time of birth, place of birth, current location, and stated relationship, lifestyle, and career preferences.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            2. Photos, Images & Astrological Documents
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            You may optionally upload profile photos, hand/palm images for traditional palmistry, and Jataka / Kundli charts (PDF or image). These media files are transferred using secure TLS encryption and stored in private Supabase Storage buckets. <b>We do not conduct facial recognition, identity matching, beauty scoring, or sensitive trait classification.</b>
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            3. AI & Automated Processing
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            Compatibility estimates and numerological values are calculated deterministically in software code. We use Google Gemini AI models running strictly server-side to generate interpretive cultural descriptions, summarize relationship dynamics, and analyze uploaded chart legibility. The Gemini API key is maintained securely on the server and is never exposed to browser clients.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            4. Administrative Access
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            Administrative access is restricted to authorized administrators and is used to operate, support, moderate, secure, and maintain the platform. Platform operators view uploaded files exclusively via short-lived signed URLs generated on-demand, and sensitive administrative views are audited in secure system logs.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            5. Retention & User Data Controls
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            You have full sovereignty over your data. Visit our <a href="/data-controls" style={{ color: "var(--gold-primary)" }}>Data Controls</a> page at any time to:
          </p>
          <ul style={{ paddingLeft: "20px", color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.8", marginTop: "8px" }}>
            <li>Export your profile and reading history as a JSON file.</li>
            <li>Purge all uploaded media files from private storage.</li>
            <li>Delete your saved compatibility analyses.</li>
            <li>Permanently close and delete your user account.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            6. Contact & Privacy Inquiries
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            For inquiries regarding privacy, corrections, or data requests, contact our privacy coordinator at: <code>privacy@yugma.ai</code> [Legal Representative Contact Placeholder].
          </p>
        </section>
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/data-controls">Data Controls</a>
          <a href="/terms">Terms of Service</a>
          <a href="/consent">Consent Policy</a>
        </div>
      </footer>
    </main>
  );
}
