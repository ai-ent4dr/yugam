"use client";

import { useState, useEffect, useMemo, useRef } from "react";

export interface AnalysisPerson {
  name: string;
  person_role: "A" | "B";
  city?: string;
  dob?: string;
  profilePhotoPath?: string;
  handPhotoPath?: string;
  jatakaPath?: string;
}

export interface AnalysisItem {
  id: string;
  status: string;
  created_at: string;
  free_or_paid?: string;
  owner_user_id?: string | null;
  session_id?: string;
  compatibility_results?: { overall_score?: number } | Array<{ overall_score?: number }>;
  analysis_people?: AnalysisPerson[];
  personA?: any;
  personB?: any;
  upload_count?: number;
  uploads?: any[];
}

export default function AnalysesTable({ initialAnalyses }: { initialAnalyses: AnalysisItem[] }) {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>(initialAnalyses);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "uploads" | "account" | "anonymous">("all");
  const [isLive, setIsLive] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());
  const [liveNotification, setLiveNotification] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  const prevIdsRef = useRef<Set<string>>(new Set(initialAnalyses.map((a) => a.id)));

  // Real-time live polling every 3 seconds
  useEffect(() => {
    if (!isLive) return;

    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/admin/analyses");
        if (!res.ok) return;
        const data = await res.json();
        const latestList: AnalysisItem[] = Array.isArray(data) ? data : (data.analyses || []);

        if (latestList.length > 0) {
          // Check for newly arrived analyses
          const newlyAdded: string[] = [];
          for (const item of latestList) {
            if (!prevIdsRef.current.has(item.id)) {
              newlyAdded.push(item.id);
              prevIdsRef.current.add(item.id);
            }
          }

          if (newlyAdded.length > 0) {
            const firstNew = latestList.find((x) => x.id === newlyAdded[0]);
            const pA = (firstNew?.analysis_people || []).find((p) => p.person_role === "A")?.name || firstNew?.personA?.name || "Someone";
            const pB = (firstNew?.analysis_people || []).find((p) => p.person_role === "B")?.name || firstNew?.personB?.name || "Partner";
            setLiveNotification(`⚡ Real-Time Query: ${pA} & ${pB} was just submitted!`);
            setNewlyArrivedIds(new Set(newlyAdded));
            setTimeout(() => setLiveNotification(null), 8000);
          }

          setAnalyses(latestList);
          setLastRefreshed(new Date());
        }
      } catch (e) {
        // network polling skipped
      }
    };

    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/analyses");
      if (res.ok) {
        const data = await res.json();
        const list: AnalysisItem[] = Array.isArray(data) ? data : (data.analyses || []);
        setAnalyses(list);
        list.forEach((item) => prevIdsRef.current.add(item.id));
        setLastRefreshed(new Date());
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      const people = a.analysis_people || [];
      const personA = people.find((p) => p.person_role === "A") || a.personA;
      const personB = people.find((p) => p.person_role === "B") || a.personB;
      const nameA = personA?.name?.toLowerCase() || "";
      const nameB = personB?.name?.toLowerCase() || "";
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        nameA.includes(query) ||
        nameB.includes(query) ||
        a.id.toLowerCase().includes(query) ||
        (personA?.city && personA.city.toLowerCase().includes(query)) ||
        (personB?.city && personB.city.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const uploadCount =
        a.upload_count ??
        [
          personA?.profilePhotoPath,
          personA?.handPhotoPath,
          personA?.jatakaPath,
          personB?.profilePhotoPath,
          personB?.handPhotoPath,
          personB?.jatakaPath,
        ].filter(Boolean).length;

      if (filter === "uploads") return uploadCount > 0;
      if (filter === "account") return Boolean(a.owner_user_id);
      if (filter === "anonymous") return !a.owner_user_id;

      return true;
    });
  }, [analyses, search, filter]);

  return (
    <div>
      {/* Live notification banner */}
      {liveNotification && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(212, 175, 55, 0.25), rgba(46, 204, 113, 0.25))",
            border: "1px solid var(--gold-primary, #d4af37)",
            color: "#fff",
            borderRadius: "10px",
            padding: "12px 18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "popIn 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
            <span style={{ fontSize: "18px" }}>✨</span>
            <span>{liveNotification}</span>
          </div>
          <button
            onClick={() => setLiveNotification(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Real-time Status Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          padding: "8px 14px",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: isLive ? "#2ecc71" : "#888",
                boxShadow: isLive ? "0 0 10px #2ecc71" : "none",
              }}
            />
            <span style={{ fontSize: "12px", fontWeight: 700, color: isLive ? "#2ecc71" : "#888", letterSpacing: "0.5px" }}>
              {isLive ? "REAL-TIME PIPELINE ACTIVE" : "PAUSED"}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-dim, #888)" }}>
            Updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIsLive(!isLive)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "var(--text-muted, #aaa)",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {isLive ? "Pause Live Polling" : "Resume Live Polling"}
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              background: "rgba(212, 175, 55, 0.15)",
              border: "1px solid var(--gold-primary, #d4af37)",
              color: "var(--gold-primary, #d4af37)",
              borderRadius: "6px",
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{isRefreshing ? "⟳ Updating..." : "⟳ Refresh Now"}</span>
          </button>
        </div>
      </div>

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 300px" }}>
          <span style={{ fontSize: "16px", opacity: 0.6 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by couple names (e.g. Aarav, Meera, Priya)..."
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

        {/* Quick Filter Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All (${analyses.length})` },
            { id: "uploads", label: "📷 With Media/Photos" },
            { id: "anonymous", label: "Guest Searches" },
            { id: "account", label: "Registered Accounts" },
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
          Showing <b>{filtered.length}</b> of <b>{analyses.length}</b> analyses matching "<b>{search}</b>"
        </p>
      )}

      {/* Analyses Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Couple Name</th>
            <th>Photos & Media</th>
            <th>Compatibility</th>
            <th>Classification</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted, #aaa)", padding: "40px" }}>
                {search ? (
                  <>
                    No analyses match your search query "<b>{search}</b>".
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
                      Clear search filter
                    </button>
                  </>
                ) : (
                  "No analyses recorded yet. Submit a reading on the home page to inspect it here."
                )}
              </td>
            </tr>
          ) : (
            filtered.map((a) => {
              const people = a.analysis_people || [];
              const personA = people.find((p) => p.person_role === "A") || a.personA;
              const personB = people.find((p) => p.person_role === "B") || a.personB;
              const couple = personA && personB ? `${personA.name} & ${personB.name}` : "Couple Analysis";
              const score = Array.isArray(a.compatibility_results)
                ? a.compatibility_results[0]?.overall_score
                : a.compatibility_results?.overall_score;

              const isJustArrived = newlyArrivedIds.has(a.id);

              const photoA = personA?.profilePhotoPath;
              const photoB = personB?.profilePhotoPath;
              const handA = personA?.handPhotoPath;
              const handB = personB?.handPhotoPath;
              const jatakaA = personA?.jatakaPath;
              const jatakaB = personB?.jatakaPath;
              const hasAnyUpload = Boolean(photoA || photoB || handA || handB || jatakaA || jatakaB || a.upload_count);

              return (
                <tr
                  key={a.id}
                  style={{
                    background: isJustArrived ? "rgba(46, 204, 113, 0.12)" : undefined,
                    transition: "background 0.5s ease",
                  }}
                >
                  <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                    <div>{new Date(a.created_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim, #888)" }}>
                      {new Date(a.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{couple}</span>
                      {isJustArrived && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            background: "#2ecc71",
                            color: "#040914",
                            fontWeight: 800,
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    {(personA?.city || personB?.city) && (
                      <div style={{ fontSize: "11px", color: "var(--text-dim, #888)", marginTop: "2px" }}>
                        📍 {[personA?.city, personB?.city].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td>
                    {/* Visual Media & Photo Indicators */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {photoA && (
                        <div
                          onClick={() =>
                            setPreviewPhoto({
                              url: `/api/admin/uploads/raw?path=${encodeURIComponent(photoA)}`,
                              title: `${personA?.name || "Person A"}'s Profile Photo`,
                            })
                          }
                          title={`Click to view ${personA?.name || "Person A"}'s Photo`}
                          style={{
                            cursor: "pointer",
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <img
                            src={`/api/admin/uploads/raw?path=${encodeURIComponent(photoA)}`}
                            alt="Person A"
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
                              fontSize: "9px",
                              fontWeight: 800,
                              borderRadius: "50%",
                              width: "14px",
                              height: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓
                          </span>
                        </div>
                      )}

                      {photoB && (
                        <div
                          onClick={() =>
                            setPreviewPhoto({
                              url: `/api/admin/uploads/raw?path=${encodeURIComponent(photoB)}`,
                              title: `${personB?.name || "Person B"}'s Profile Photo`,
                            })
                          }
                          title={`Click to view ${personB?.name || "Person B"}'s Photo`}
                          style={{
                            cursor: "pointer",
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <img
                            src={`/api/admin/uploads/raw?path=${encodeURIComponent(photoB)}`}
                            alt="Person B"
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
                              fontSize: "9px",
                              fontWeight: 800,
                              borderRadius: "50%",
                              width: "14px",
                              height: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓
                          </span>
                        </div>
                      )}

                      {/* Badges for Hand or Kundli documents */}
                      {(handA || handB) && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(212, 175, 55, 0.15)",
                            color: "var(--gold-primary, #d4af37)",
                            fontWeight: 600,
                          }}
                        >
                          ✋ Palm
                        </span>
                      )}

                      {(jatakaA || jatakaB) && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(52, 152, 219, 0.15)",
                            color: "#3498db",
                            fontWeight: 600,
                          }}
                        >
                          📜 Kundli
                        </span>
                      )}

                      {!hasAnyUpload && (
                        <span style={{ fontSize: "11px", color: "var(--text-dim, #666)" }}>
                          No media
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        color: "var(--gold-primary, #d4af37)",
                        fontWeight: 700,
                        fontSize: "15px",
                      }}
                    >
                      {score !== undefined ? `${score}%` : "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: a.owner_user_id ? "rgba(228,189,117,0.15)" : "rgba(255,255,255,0.06)",
                        color: a.owner_user_id ? "var(--gold-primary, #d4af37)" : "var(--text-dim, #888)",
                        fontWeight: 600,
                      }}
                    >
                      {a.owner_user_id ? "Account" : "Guest Query"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        textTransform: "capitalize",
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background:
                          a.status === "completed"
                            ? "rgba(46, 204, 113, 0.15)"
                            : "rgba(255, 255, 255, 0.1)",
                        color: a.status === "completed" ? "#2ecc71" : "var(--text-muted, #aaa)",
                        fontWeight: 600,
                      }}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`/admin/analyses/${a.id}`}
                      className="btn-secondary"
                      style={{ padding: "4px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                    >
                      Inspect →
                    </a>
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
