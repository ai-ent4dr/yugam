import { FREE_ANALYSIS_LIMIT } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

// In-memory fallback map for environments where Supabase DB is not yet provisioned
const localUsageStore = new Map<string, number>();

export async function getUsage(sessionId: string): Promise<number> {
  if (!sessionId) return 0;
  try {
    const db = createAdminClient();
    const { count, error } = await db
      .from("usage_limits")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return localUsageStore.get(sessionId) ?? 0;
  }
}

export async function getRemainingFreeAnalyses(sessionId: string): Promise<number> {
  const used = await getUsage(sessionId);
  return Math.max(0, FREE_ANALYSIS_LIMIT - used);
}

export async function canRunAnalysis(sessionId: string): Promise<boolean> {
  return (await getRemainingFreeAnalyses(sessionId)) > 0;
}

export async function incrementUsage(sessionId: string, userId?: string): Promise<void> {
  if (!sessionId) return;
  try {
    const db = createAdminClient();
    const { error } = await db.from("usage_limits").insert({
      session_id: sessionId,
      user_id: userId ?? null,
    });
    if (error) throw error;
  } catch {
    const current = localUsageStore.get(sessionId) ?? 0;
    localUsageStore.set(sessionId, current + 1);
  }
}
