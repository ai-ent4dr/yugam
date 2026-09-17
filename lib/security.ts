import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function sanitizeFilename(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export function generateSafeStoragePath(
  ownerOrSession: string,
  analysisId: string,
  kind: string,
  extension: string
): string {
  const safeSession = ownerOrSession.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeAnalysis = analysisId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const cleanExt = extension.replace(/^\./, "").toLowerCase();
  return `${safeSession}/${safeAnalysis}/${kind}_${randomSuffix}.${cleanExt}`;
}

export function isAllowedMimeType(mime: string, allowed: readonly string[]): boolean {
  return allowed.includes(mime.toLowerCase());
}

export async function logAdminAction(params: {
  adminUserId?: string;
  action: "VIEW_USER" | "VIEW_ANALYSIS" | "VIEW_UPLOAD" | "DELETE_UPLOAD" | "DELETE_USER" | "EXPORT_DATA";
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const db = createAdminClient();
    await db.from("audit_logs").insert({
      admin_user_id: params.adminUserId ?? null,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId ?? null,
      details: params.details ?? {},
    });
  } catch (e) {
    console.warn("Audit log error:", e);
  }
}
