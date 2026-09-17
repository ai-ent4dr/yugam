export default function TermsPage() {
  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/data-controls">Data Controls</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">TERMS OF SERVICE</p>
        <h1 style={{ fontSize: "36px" }}>Terms & Conditions</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          Effective: September 2026 · [Pending External Legal Review]
        </p>
      </div>

      <div className="panel" style={{ maxWidth: "820px" }}>
        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            1. Age Eligibility Gate
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to use Yugma AI. Minors are strictly prohibited from participating in relationship compatibility evaluations.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            2. Representation and Consent
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            By submitting information or images for Person A and Person B, you expressly affirm that you have obtained consent from each individual to process their biographical details and media for the purpose of this analysis.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            3. Cultural & Interpretive Nature (No Scientific Guarantee)
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            Traditional astrology (Jataka/Kundli), numerology, and palmistry modules are interpretive cultural readings provided for reflection, personal exploration, and entertainment purposes. They are <b>not scientifically validated predictions</b>, guaranteed life outcomes, medical diagnoses, psychological advice, or legal assessments.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            4. Prohibited Uses
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            Users agree not to use Yugma AI to harass, stalk, defame, impersonate, or profile any individual without consent; not to attempt unauthorized extraction of private storage objects; and not to reverse engineer or abuse rate limits.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", color: "var(--gold-primary)", marginBottom: "8px" }}>
            5. Limitation of Liability
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            Yugma AI and its operators provide this platform on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind regarding specific relationship success or deterministic future predictions.
          </p>
        </section>
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/data-controls">Data Controls</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/consent">Consent Policy</a>
        </div>
      </footer>
    </main>
  );
}
