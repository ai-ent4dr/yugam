export const FREE_ANALYSIS_LIMIT = Math.max(1, Number(process.env.FREE_ANALYSIS_LIMIT ?? 5));
export const MINIMUM_AGE = Math.max(18, Number(process.env.MINIMUM_AGE ?? 18));
export const MAX_UPLOAD_BYTES = Math.max(1, Number(process.env.MAX_UPLOAD_BYTES ?? 2_000_000));
export const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? "user-uploads";
export const ADMIN_EMAILS = new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
