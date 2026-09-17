// Global in-memory storage for analysis records to ensure consistency
// across Next.js Turbopack API route workers and React Server Components in local dev.

declare global {
  // eslint-disable-next-line no-var
  var __YUGMA_ANALYSIS_STORE__: Map<string, any> | undefined;
}

export const localAnalysisStore: Map<string, any> =
  globalThis.__YUGMA_ANALYSIS_STORE__ ??
  (globalThis.__YUGMA_ANALYSIS_STORE__ = new Map<string, any>());
