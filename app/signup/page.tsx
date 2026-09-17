"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const client = createBrowserClient();
      const { data, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${location.origin}/account`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        location.assign("/account");
      } else {
        setMessage("Account created! Check your email inbox to confirm your account.");
      }
    } catch (err: any) {
      setError(err.message || "We could not create your account. Please check your credentials.");
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
          <a href="/">Home</a>
          <a href="/login">Sign In</a>
          <a href="/privacy">Privacy</a>
        </div>
      </nav>

      <section style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
        <div className="panel" style={{ maxWidth: "480px", width: "100%" }}>
          <p className="eyebrow">CONTINUE YOUR JOURNEY</p>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "6px 0 10px" }}>
            Unlock Your Full Yugma Experience
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Create a free account to save ongoing readings, access past analyses, and export your confidential compatibility archives.
          </p>

          <form onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label>Your Name <em>optional</em></label>
              <input
                type="text"
                placeholder="e.g. Samarth"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label>Email Address *</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label>Password *</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && <p style={{ color: "#2ecc71", fontSize: "13px", marginBottom: "12px" }}>{message}</p>}
            {error && <p className="error-text" style={{ marginBottom: "12px" }}>{error}</p>}

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Creating Account…" : "Create Free Account →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
            Already registered?{" "}
            <a href="/login" style={{ color: "var(--gold-primary)", fontWeight: 600 }}>
              Sign in here
            </a>
          </div>
        </div>
      </section>

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
