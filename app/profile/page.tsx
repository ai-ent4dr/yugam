"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    gender: "male",
    dob: "",
    city: "",
    education: "",
    career: "",
    relationshipGoal: "Marriage",
    futureGoal: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile({
            name: data.profile.name || "",
            gender: data.profile.gender || "male",
            dob: data.profile.dob || "",
            city: data.profile.city || "",
            education: data.profile.education || "",
            career: data.profile.career || "",
            relationshipGoal: data.profile.relationship_goal || "Marriage",
            futureGoal: data.profile.future_goal || "",
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setMessage("Profile updated successfully! ✓");
    } catch (err: any) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/account">Dashboard</a>
          <a href="/history">History</a>
          <a href="/data-controls">Data Controls</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">YOUR INFORMATION</p>
        <h1 style={{ fontSize: "36px" }}>Personal Profile</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          Maintain your personal background details and core relationship preferences.
        </p>
      </div>

      <div className="panel" style={{ maxWidth: "700px" }}>
        <div className="panel-header">
          <span className="step-label">DETAILS</span>
          <h2>Edit Profile</h2>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading profile information…</p>
        ) : (
          <form onSubmit={saveProfile}>
            <div className="fields-grid">
              <div className="form-group span-2">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Current City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="e.g. Bangalore"
                />
              </div>

              <div className="form-group">
                <label>Education / Degree</label>
                <input
                  type="text"
                  value={profile.education}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  placeholder="e.g. Masters in Design"
                />
              </div>

              <div className="form-group">
                <label>Current Profession</label>
                <input
                  type="text"
                  value={profile.career}
                  onChange={(e) => setProfile({ ...profile, career: e.target.value })}
                  placeholder="e.g. Architect"
                />
              </div>

              <div className="form-group">
                <label>Relationship Intention</label>
                <select
                  value={profile.relationshipGoal}
                  onChange={(e) => setProfile({ ...profile, relationshipGoal: e.target.value })}
                >
                  <option value="Marriage">Marriage</option>
                  <option value="Long-term relationship">Long-term relationship</option>
                  <option value="Life companionship">Life companionship</option>
                  <option value="Dating / explore">Dating / explore</option>
                </select>
              </div>

              <div className="form-group span-2">
                <label>Long-term Future Vision</label>
                <input
                  type="text"
                  value={profile.futureGoal}
                  onChange={(e) => setProfile({ ...profile, futureGoal: e.target.value })}
                  placeholder="e.g. Building a balanced family life and pursuing entrepreneurship"
                />
              </div>
            </div>

            {message && <p style={{ color: "#2ecc71", marginTop: "14px", fontSize: "14px" }}>{message}</p>}
            {error && <p className="error-text">{error}</p>}

            <div style={{ marginTop: "24px" }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Profile Changes"}
              </button>
            </div>
          </form>
        )}
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
