"use client";

import { useState } from "react";

export default function AdminUploadViewer({ uploads }: { uploads: any[] }) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState<Record<string, boolean>>({});

  const requestSignedUrl = async (upload: any) => {
    const uploadId = upload.id || upload.storage_path;
    setLoadingId(uploadId);
    setError("");
    try {
      const res = await fetch(`/api/admin/uploads/${encodeURIComponent(uploadId)}/signed-url`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate signed URL");
      setSignedUrls((prev) => ({ ...prev, [uploadId]: data.signedUrl }));
    } catch (err: any) {
      setError(err.message || "Failed to retrieve signed URL");
    } finally {
      setLoadingId(null);
    }
  };

  if (!uploads || uploads.length === 0) {
    return (
      <div
        style={{
          background: "#080e1b",
          border: "1px dashed var(--border-subtle)",
          borderRadius: "10px",
          padding: "24px",
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: "13px",
        }}
      >
        <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>📷</span>
        No media files or Jataka documents were attached for this analysis.
      </div>
    );
  }

  return (
    <div>
      {error && <p className="error-text" style={{ marginBottom: "12px" }}>{error}</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {uploads.map((u, idx) => {
          const uploadKey = u.id || u.storage_path || `upload-${idx}`;
          const isPdf =
            u.mime_type === "application/pdf" ||
            u.storage_path?.toLowerCase().endsWith(".pdf") ||
            u.original_filename?.toLowerCase().endsWith(".pdf");
          const isImage = !isPdf;

          const directRawUrl = u.preview_url || (u.storage_path ? `/api/admin/uploads/raw?path=${encodeURIComponent(u.storage_path)}` : null);
          const activeUrl = signedUrls[uploadKey] || signedUrls[u.id] || directRawUrl;
          const typeLabel = (u.type || u.file_type || "uploaded_media").replace(/_/g, " ");
          const hasImageError = previewError[uploadKey];

          return (
            <div
              key={uploadKey}
              style={{
                background: "#080e1b",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--gold-primary)",
                      letterSpacing: "0.5px",
                      background: "rgba(228,189,117,0.1)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {typeLabel}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    {u.size_bytes ? (
                      u.size_bytes > 1024 * 1024
                        ? `${(u.size_bytes / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(u.size_bytes / 1024)} KB`
                    ) : (
                      "Media attached"
                    )}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    marginBottom: "4px",
                    wordBreak: "break-word",
                  }}
                >
                  {u.original_filename || "Uploaded File"}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontFamily: "monospace",
                    marginBottom: "12px",
                    wordBreak: "break-all",
                  }}
                >
                  {u.storage_path}
                </p>

                {/* Media Preview Box */}
                {isImage && activeUrl && !hasImageError && (
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid var(--border-subtle)",
                      background: "#02050b",
                      marginBottom: "12px",
                      height: "190px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={activeUrl}
                      alt={typeLabel}
                      onError={() => setPreviewError((prev) => ({ ...prev, [uploadKey]: true }))}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}

                {isPdf && (
                  <div
                    style={{
                      padding: "24px 12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      textAlign: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "6px" }}>📜</span>
                    <span style={{ fontSize: "12px", color: "var(--gold-hover)", fontWeight: 600 }}>
                      Traditional Kundli / Jataka PDF
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeUrl ? (
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{
                      fontSize: "12px",
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      padding: "8px",
                    }}
                  >
                    Open Full {isPdf ? "PDF Document" : "Image"} ↗
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestSignedUrl(u)}
                    className="btn-secondary"
                    style={{ width: "100%", fontSize: "12px", padding: "8px" }}
                    disabled={loadingId === uploadKey}
                  >
                    {loadingId === uploadKey ? "Signing Token…" : "Generate Signed URL 🔒"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
