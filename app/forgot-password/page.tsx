"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);

    try {
      const { error } = await createBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/settings`,
      });
      if (error) throw error;
      setMessage("If an account exists with this email, a password reset link has been dispatched.");
    } catch {
      setMessage("If an account exists with this email, a password reset link has been dispatched.");
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
        </div>
      </nav>

      <section style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
        <div className="panel" style={{ maxWidth: "460px", width: "100%" }}>
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "6px 0 10px" }}>
            Reset Password
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Enter the email address linked to your Yugma AI account and we will send a secure recovery link.
          </p>

          <form onSubmit={send}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {message && (
              <p style={{ color: "#2ecc71", fontSize: "13px", marginBottom: "16px", lineHeight: "1.5" }}>
                {message}
              </p>
            )}

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Sending…" : "Send Recovery Link"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
            Remembered your password?{" "}
            <a href="/login" style={{ color: "var(--gold-primary)", fontWeight: 600 }}>
              Back to sign in
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
      </footer>
    </main>
  );
}
