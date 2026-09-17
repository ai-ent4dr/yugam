"use client";

import { useState } from "react";

export default function DataControlsPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleExport = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Could not export data. Ensure you are signed in.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yugma-user-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setMessage("Your data archive has been downloaded successfully. ✓");
    } catch (err: any) {
      setError(err.message || "Failed to export data.");
    } finally {
      setBusy(false);
    }
  };

  const executeDeleteAction = async (action: "delete-uploads" | "delete-analyses" | "delete-account", promptText: string) => {
    const confirmed = window.confirm(promptText);
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");

      if (action === "delete-account") {
        alert("Your account and all associated data have been permanently removed.");
        location.assign("/");
      } else {
        setMessage(data.message || "Action completed successfully. ✓");
      }
    } catch (err: any) {
      setError(err.message || "Could not complete deletion request.");
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
          <a href="/history">History</a>
          <a href="/account">Account</a>
          <a href="/privacy">Privacy</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">USER SOVEREIGNTY & PRIVACY</p>
        <h1 style={{ fontSize: "36px" }}>Your Data, Your Choices</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          You maintain full ownership of your submitted couple information, photos, and readings. Execute downloads or permanent purges below.
        </p>
      </div>

      <div className="panel" style={{ maxWidth: "760px" }}>
        <span className="step-label">DATA PORTABILITY</span>
        <h2>Export Your Data</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "8px 0 16px" }}>
          Download a machine-readable JSON archive of your profile, compatibility calculations, readings, and file upload records.
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="btn-secondary"
          disabled={busy}
        >
          ⬇ Download Complete JSON Archive
        </button>
      </div>

      <div className="panel" style={{ maxWidth: "760px", marginTop: "20px" }}>
        <span className="step-label" style={{ color: "#ff7b72" }}>DESTRUCTION CONTROLS</span>
        <h2>Manage & Purge Stored Data</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "8px 0 16px" }}>
          Destructive actions immediately delete records from the database and remove objects from private storage. These actions cannot be undone.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
            <div>
              <p style={{ fontWeight: 600 }}>Delete Uploaded Media Only</p>
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Purges all profile photos, hand images, and Kundli documents from private Storage.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ color: "#ff7b72", borderColor: "rgba(255,123,114,0.3)" }}
              onClick={() =>
                executeDeleteAction(
                  "delete-uploads",
                  "Are you sure you want to delete all uploaded photos and documents? Your saved text analyses will remain."
                )
              }
              disabled={busy}
            >
              Delete Uploads
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
            <div>
              <p style={{ fontWeight: 600 }}>Delete All Saved Analyses</p>
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Removes all past compatibility reports and Jataka reading records.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ color: "#ff7b72", borderColor: "rgba(255,123,114,0.3)" }}
              onClick={() =>
                executeDeleteAction(
                  "delete-analyses",
                  "Are you sure you want to delete all your saved analyses? This action is permanent."
                )
              }
              disabled={busy}
            >
              Delete Analyses
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px" }}>
            <div>
              <p style={{ fontWeight: 600, color: "#ff7b72" }}>Delete Full Account & All Data</p>
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Completely closes your account, removes profile, storage files, and all associated readings.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ background: "rgba(255,123,114,0.12)", color: "#ff7b72", borderColor: "#ff7b72" }}
              onClick={() =>
                executeDeleteAction(
                  "delete-account",
                  "WARNING: Are you sure you want to permanently delete your entire account and all associated data? This action CANNOT be undone."
                )
              }
              disabled={busy}
            >
              Delete Account
            </button>
          </div>
        </div>

        {message && <p style={{ color: "#2ecc71", marginTop: "16px", fontSize: "14px" }}>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/consent">Consent Policy</a>
        </div>
      </footer>
    </main>
  );
}
