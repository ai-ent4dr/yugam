"use client";

import { useState } from "react";

export default function AdminUploadViewer({ uploads }: { uploads: any[] }) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const requestSignedUrl = async (uploadId: string) => {
    setLoadingId(uploadId);
    setError("");
    try {
      const res = await fetch(`/api/admin/uploads/${uploadId}/signed-url`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate signed URL");
      setSignedUrls((prev) => ({ ...prev, [uploadId]: data.signedUrl }));
    } catch (err: any) {
      setError(err.message || "Failed to retrieve signed URL");
    } finally {
      setLoadingId(null);
    }
  };

  if (uploads.length === 0) {
    return (
      <p style={{ color: "var(--text-dim)", fontSize: "13px", padding: "12px 0" }}>
        No media files or Jataka documents were uploaded for this analysis.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="error-text" style={{ marginBottom: "12px" }}>{error}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {uploads.map((u) => {
          const url = signedUrls[u.id];
          const isImage = u.mime_type?.startsWith("image/");
          const isPdf = u.mime_type === "application/pdf";

          return (
            <div
              key={u.id}
              style={{
                background: "#080e1b",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--gold-primary)",
                  }}
                >
                  {u.type.replace("_", " ")}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                  {Math.round((u.size_bytes || 0) / 1024)} KB
                </span>
              </div>

              <p style={{ fontSize: "12px", color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "12px" }}>
                {u.original_filename || u.storage_path}
              </p>

              {url ? (
                <div style={{ marginTop: "10px" }}>
                  {isImage && (
                    <img
                      src={url}
                      alt={u.type}
                      style={{
                        width: "100%",
                        maxHeight: "180px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        background: "#03060c",
                        border: "1px solid var(--border-subtle)",
                        marginBottom: "8px",
                      }}
                    />
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: "11px", display: "inline-block", width: "100%", textAlign: "center" }}
                  >
                    Open Full {isPdf ? "PDF Document" : "Image"} ↗
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => requestSignedUrl(u.id)}
                  className="btn-secondary"
                  style={{ width: "100%", fontSize: "12px" }}
                  disabled={loadingId === u.id}
                >
                  {loadingId === u.id ? "Signing Request…" : "Generate Signed URL 🔒"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
