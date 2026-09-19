export const FREE_ANALYSIS_LIMIT = Math.max(1, Number(process.env.FREE_ANALYSIS_LIMIT ?? 999_999));
export const MINIMUM_AGE = Math.max(18, Number(process.env.MINIMUM_AGE ?? 18));
export const MAX_UPLOAD_BYTES = (() => {
  const raw = process.env.MAX_UPLOAD_BYTES;
  if (!raw) return 50 * 1024 * 1024; // 50 MB safe default
  const str = raw.toString().trim().toUpperCase();
  if (str.endsWith("MB")) {
    const n = parseFloat(str.replace("MB", "").trim());
    return !isNaN(n) && n > 0 ? Math.round(n * 1024 * 1024) : 50 * 1024 * 1024;
  }
  if (str.endsWith("KB")) {
    const n = parseFloat(str.replace("KB", "").trim());
    return !isNaN(n) && n > 0 ? Math.round(n * 1024) : 50 * 1024 * 1024;
  }
  const num = Number(str);
  if (isNaN(num) || num <= 0) return 50 * 1024 * 1024;
  // If user entered a small number like 5, 10, 50, 500, they intended Megabytes!
  if (num < 1000) return Math.round(num * 1024 * 1024);
  return num;
})();
export const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? "user-uploads";
export const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

// Configurable deterministic compatibility component weights (must sum to 100%)
export const COMPATIBILITY_WEIGHTS = {
  values: 0.25,
  relationshipGoals: 0.15,
  lifestyle: 0.15,
  careerGoals: 0.15,
  ageCompatibility: 0.15,
  location: 0.10,
  educationInterests: 0.05,
} as const;

