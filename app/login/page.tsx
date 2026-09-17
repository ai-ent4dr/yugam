"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const client = createBrowserClient();
      const { data, error: signInErr } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) throw signInErr;

      location.assign("/account");
    } catch (err: any) {
      setError(err.message || "We could not sign you in. Please check your credentials.");
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
          <a href="/signup">Create Account</a>
          <a href="/privacy">Privacy</a>
        </div>
      </nav>

      <section style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
        <div className="panel" style={{ maxWidth: "460px", width: "100%" }}>
          <p className="eyebrow">WELCOME BACK</p>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "6px 0 10px" }}>
            Sign In to Yugma AI
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Access your saved readings, compatibility history, and account profile.
          </p>

          <form onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label>
                <span>Password</span>
                <a href="/forgot-password" style={{ fontSize: "12px", color: "var(--gold-primary)" }}>
                  Forgot password?
                </a>
              </label>
              <input
                type="password"
                required
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="error-text" style={{ marginBottom: "12px" }}>{error}</p>}

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Signing In…" : "Sign In →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
            Need an account?{" "}
            <a href="/signup" style={{ color: "var(--gold-primary)", fontWeight: 600 }}>
              Create a free account
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
