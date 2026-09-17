import fs from "fs";
import path from "path";

// Types for stored local records
export interface StoredUpload {
  id: string;
  analysisId?: string;
  kind?: string;
  type: string; // profile_photo | hand_photo | jataka_document
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  filePath?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __YUGMA_ANALYSIS_STORE__: Map<string, any> | undefined;
  // eslint-disable-next-line no-var
  var __YUGMA_UPLOAD_STORE__: Map<string, { buffer: Buffer; meta: StoredUpload }> | undefined;
  // eslint-disable-next-line no-var
  var __YUGMA_UPLOAD_META_STORE__: Map<string, StoredUpload> | undefined;
}

export const localAnalysisStore: Map<string, any> =
  globalThis.__YUGMA_ANALYSIS_STORE__ ??
  (globalThis.__YUGMA_ANALYSIS_STORE__ = new Map<string, any>());

export const localUploadStore: Map<string, { buffer: Buffer; meta: StoredUpload }> =
  globalThis.__YUGMA_UPLOAD_STORE__ ??
  (globalThis.__YUGMA_UPLOAD_STORE__ = new Map());

export const localUploadMetaStore: Map<string, StoredUpload> =
  globalThis.__YUGMA_UPLOAD_META_STORE__ ??
  (globalThis.__YUGMA_UPLOAD_META_STORE__ = new Map());

// Local disk persistence helpers
const DATA_DIR = path.join(process.cwd(), ".data");
const ANALYSES_FILE = path.join(DATA_DIR, "analyses.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const UPLOADS_META_FILE = path.join(DATA_DIR, "uploads.json");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch {
    // ignore in serverless environments where cwd may be read-only
  }
}

// Initialize memory maps from disk on boot
function initFromDisk() {
  ensureDirs();
  try {
    if (fs.existsSync(ANALYSES_FILE)) {
      const data = fs.readFileSync(ANALYSES_FILE, "utf-8");
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item?.id && !localAnalysisStore.has(item.id)) {
            localAnalysisStore.set(item.id, item);
          }
        }
      }
    }
  } catch {
    // Disk read failed, fallback to memory
  }

  try {
    if (fs.existsSync(UPLOADS_META_FILE)) {
      const data = fs.readFileSync(UPLOADS_META_FILE, "utf-8");
      const list: StoredUpload[] = JSON.parse(data);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item?.storagePath) {
            localUploadMetaStore.set(item.storagePath, item);
            if (item.id) localUploadMetaStore.set(item.id, item);
          }
        }
      }
    }
  } catch {
    // Disk read failed
  }
}

initFromDisk();

function persistAnalysesToDisk() {
  ensureDirs();
  try {
    const list = Array.from(localAnalysisStore.values());
    fs.writeFileSync(ANALYSES_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // Disk write error ignored in dev
  }
}

function persistUploadsMetaToDisk() {
  ensureDirs();
  try {
    const list = Array.from(new Set(localUploadMetaStore.values()));
    fs.writeFileSync(UPLOADS_META_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // Disk write error ignored
  }
}

export function saveStoredAnalysis(id: string, record: any) {
  localAnalysisStore.set(id, record);
  persistAnalysesToDisk();
}

export function getStoredAnalysis(id: string): any | null {
  if (localAnalysisStore.has(id)) return localAnalysisStore.get(id);
  initFromDisk();
  return localAnalysisStore.get(id) ?? null;
}

export function getAllStoredAnalyses(): any[] {
  initFromDisk();
  return Array.from(localAnalysisStore.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function saveLocalUpload(
  storagePath: string,
  buffer: Buffer,
  meta: {
    id?: string;
    analysisId?: string;
    kind?: string;
    type?: string;
    mimeType: string;
    originalFilename: string;
    sizeBytes: number;
  }
): Promise<StoredUpload> {
  ensureDirs();

  const id = meta.id || `up-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const sanitizedPath = storagePath.replace(/[^a-zA-Z0-9._-]/g, "_");
  const diskPath = path.join(UPLOADS_DIR, sanitizedPath);

  try {
    fs.writeFileSync(diskPath, buffer);
  } catch (e) {
    console.warn("Could not save upload to disk, holding in memory buffer:", e);
  }

  const uploadRecord: StoredUpload = {
    id,
    analysisId: meta.analysisId,
    kind: meta.kind,
    type: meta.type || "profile_photo",
    storagePath,
    originalFilename: meta.originalFilename,
    mimeType: meta.mimeType,
    sizeBytes: meta.sizeBytes,
    createdAt: new Date().toISOString(),
    filePath: diskPath,
  };

  // Cache in memory
  localUploadStore.set(storagePath, { buffer, meta: uploadRecord });
  localUploadStore.set(id, { buffer, meta: uploadRecord });

  localUploadMetaStore.set(storagePath, uploadRecord);
  localUploadMetaStore.set(id, uploadRecord);

  persistUploadsMetaToDisk();

  return uploadRecord;
}

export async function getLocalUpload(
  storagePathOrId: string
): Promise<{ buffer: Buffer; meta: StoredUpload } | null> {
  // 1. Check in-memory store
  if (localUploadStore.has(storagePathOrId)) {
    return localUploadStore.get(storagePathOrId)!;
  }

  initFromDisk();

  // 2. Check metadata store
  const meta = localUploadMetaStore.get(storagePathOrId);
  if (meta?.filePath && fs.existsSync(meta.filePath)) {
    try {
      const buffer = fs.readFileSync(meta.filePath);
      const record = { buffer, meta };
      localUploadStore.set(storagePathOrId, record);
      return record;
    } catch {
      // disk read error
    }
  }

  // 3. Try finding by matching sanitized path directly in uploads folder
  const sanitized = storagePathOrId.replace(/[^a-zA-Z0-9._-]/g, "_");
  const directPath = path.join(UPLOADS_DIR, sanitized);
  if (fs.existsSync(directPath)) {
    try {
      const buffer = fs.readFileSync(directPath);
      const fallbackMeta: StoredUpload = meta ?? {
        id: storagePathOrId,
        type: storagePathOrId.includes("hand")
          ? "hand_photo"
          : storagePathOrId.includes("jataka")
          ? "jataka_document"
          : "profile_photo",
        storagePath: storagePathOrId,
        originalFilename: path.basename(storagePathOrId),
        mimeType: storagePathOrId.endsWith(".pdf")
          ? "application/pdf"
          : storagePathOrId.endsWith(".png")
          ? "image/png"
          : "image/jpeg",
        sizeBytes: buffer.length,
        createdAt: new Date().toISOString(),
        filePath: directPath,
      };
      const record = { buffer, meta: fallbackMeta };
      localUploadStore.set(storagePathOrId, record);
      return record;
    } catch {
      // disk read error
    }
  }

  return null;
}

export function getAllStoredUploads(analysisId?: string): StoredUpload[] {
  initFromDisk();
  const all = Array.from(new Set(localUploadMetaStore.values()));
  if (!analysisId) return all;
  return all.filter((u) => u.analysisId === analysisId);
}
