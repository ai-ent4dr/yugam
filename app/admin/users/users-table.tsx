"use client";

import { useState, useMemo } from "react";

export interface ProfileRecord {
  id: string;
  name: string;
  email?: string;
  gender?: string;
  dob?: string;
  city?: string;
  birthPlace?: string;
  relationshipGoal?: string;
  partnerName?: string;
  analysisId?: string;
  createdAt: string;
  source: "account" | "analysis_person";
  status?: string;
  analysisCount?: number;
  profilePhotoPath?: string;
}

export default function UsersTable({ initialProfiles }: { initialProfiles: ProfileRecord[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "analysis_person" | "account">("all");
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  const filtered = useMemo(() => {
    return initialProfiles.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.partnerName && p.partnerName.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.birthPlace && p.birthPlace.toLowerCase().includes(q)) ||
        (p.relationshipGoal && p.relationshipGoal.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filter === "account") return p.source === "account";
      if (filter === "analysis_person") return p.source === "analysis_person";

      return true;
    });
  }, [initialProfiles, search, filter]);

  const guestCount = initialProfiles.filter((p) => p.source === "analysis_person").length;
  const accountCount = initialProfiles.filter((p) => p.source === "account").length;

  return (
    <div>
      {/* Search & Filter Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 320px" }}>
          <span style={{ fontSize: "16px", opacity: 0.6 }}>🔍</span>
          <input
            type="text"
            placeholder="Search searched names, partners, cities, or emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-color, #f0ede6)",
              fontSize: "14px",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim, #888)",
                cursor: "pointer",
                fontSize: "14px",
                padding: "2px 6px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All Profiles (${initialProfiles.length})` },
            { id: "analysis_person", label: `🔍 Searched Names (${guestCount})` },
            { id: "account", label: `👤 Registered Accounts (${accountCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: filter === tab.id ? "var(--gold-primary, #d4af37)" : "rgba(255, 255, 255, 0.1)",
                background: filter === tab.id ? "rgba(212, 175, 55, 0.15)" : "transparent",
                color: filter === tab.id ? "var(--gold-primary, #d4af37)" : "var(--text-muted, #aaa)",
                cursor: "pointer",
                fontWeight: filter === tab.id ? 600 : 400,
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {search && (
        <p style={{ fontSize: "13px", color: "var(--text-muted, #aaa)", marginBottom: "14px" }}>
          Showing <b>{filtered.length}</b> of <b>{initialProfiles.length}</b> profiles matching "<b>{search}</b>"
        </p>
      )}

      {/* Profiles Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Profile Name</th>
            <th>Type</th>
            <th>Date of Birth / Age</th>
            <th>Location</th>
            <th>Relationship Goal</th>
            <th>Analyzed With</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted, #aaa)", padding: "40px" }}>
                {search ? (
                  <>
                    No names or profiles match "<b>{search}</b>".
                    <br />
                    <button
                      onClick={() => setSearch("")}
                      style={{
                        marginTop: "12px",
                        background: "rgba(212, 175, 55, 0.15)",
                        border: "1px solid var(--gold-primary, #d4af37)",
                        color: "var(--gold-primary, #d4af37)",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  "No profiles recorded yet. Search or analyze compatibility on the home page to populate profiles here."
                )}
              </td>
            </tr>
          ) : (
            filtered.map((p) => {
              const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {p.profilePhotoPath ? (
                        <div
                          onClick={() =>
                            setPreviewPhoto({
                              url: `/api/admin/uploads/raw?path=${encodeURIComponent(p.profilePhotoPath!)}`,
                              title: `${p.name}'s Profile Photo`,
                            })
                          }
                          style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                          title="Click to preview photo"
                        >
                          <img
                            src={`/api/admin/uploads/raw?path=${encodeURIComponent(p.profilePhotoPath)}`}
                            alt={p.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid #2ecc71",
                              display: "block",
                            }}
                            onError={(e) => {
                              (e.target as any).style.display = "none";
                            }}
                          />
                          <span
                            style={{
                              position: "absolute",
                              bottom: "-2px",
                              right: "-2px",
                              background: "#2ecc71",
                              color: "#040914",
                              fontSize: "8px",
                              fontWeight: 800,
                              borderRadius: "50%",
                              width: "12px",
                              height: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--gold-primary, #d4af37)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary, #f0ede6)" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim, #888)", marginTop: "2px" }}>
                          {p.email || (p.gender ? `Gender: ${p.gender}` : "Guest Submission")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: p.source === "account" ? "rgba(228,189,117,0.15)" : "rgba(46, 204, 113, 0.15)",
                        color: p.source === "account" ? "var(--gold-primary, #d4af37)" : "#2ecc71",
                        fontWeight: 600,
                      }}
                    >
                      {p.source === "account" ? "Account User" : "Searched Name"}
                    </span>
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {p.dob ? (
                      <div>
                        <b>{p.dob}</b>
                        {age && !isNaN(age) && (
                          <span style={{ color: "var(--text-dim, #888)", marginLeft: "6px" }}>
                            ({age} yrs)
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {p.city || p.birthPlace || "—"}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {p.relationshipGoal || "Marriage"}
                  </td>
                  <td>
                    {p.partnerName ? (
                      <span style={{ fontWeight: 600, color: "var(--gold-hover, #e4bd75)", fontSize: "13px" }}>
                        & {p.partnerName}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {p.analysisId ? (
                      <a
                        href={`/admin/analyses/${p.analysisId}`}
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "11px", whiteSpace: "nowrap" }}
                      >
                        Analysis →
                      </a>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-dim, #888)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Photo Preview Lightbox Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d1527",
              border: "1px solid var(--gold-primary, #d4af37)",
              borderRadius: "14px",
              padding: "20px",
              maxWidth: "500px",
              width: "100%",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", color: "var(--gold-primary, #d4af37)", margin: 0 }}>
                {previewPhoto.title}
              </h3>
              <button
                onClick={() => setPreviewPhoto(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#aaa",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.title}
              style={{
                maxWidth: "100%",
                maxHeight: "65vh",
                borderRadius: "10px",
                objectFit: "contain",
                margin: "0 auto",
                display: "block",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <a
                href={previewPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                Open Full Resolution ↗
              </a>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="btn-primary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
