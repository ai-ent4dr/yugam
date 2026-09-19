// Free limits removed: unlimited analyses are permitted for all users and visitors.
export async function getUsage(sessionId: string): Promise<number> {
  return 0;
}

export async function getRemainingFreeAnalyses(sessionId: string): Promise<number> {
  return 999999;
}

export async function canRunAnalysis(sessionId: string): Promise<boolean> {
  return true; // Always allow analysis - no free limits
}

export async function incrementUsage(sessionId: string, userId?: string): Promise<void> {
  // no-op
}
