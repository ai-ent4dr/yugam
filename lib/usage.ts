import { FREE_ANALYSIS_LIMIT } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
export async function getUsage(sessionId: string) { const db = createAdminClient(); const { count, error } = await db.from("usage_limits").select("id", { count: "exact", head: true }).eq("session_id", sessionId); if (error) throw error; return count ?? 0; }
export async function getRemainingFreeAnalyses(sessionId: string) { return Math.max(0, FREE_ANALYSIS_LIMIT - await getUsage(sessionId)); }
export async function canRunAnalysis(sessionId: string) { return (await getRemainingFreeAnalyses(sessionId)) > 0; }
export async function incrementUsage(sessionId: string) { const { error } = await createAdminClient().from("usage_limits").insert({ session_id: sessionId }); if (error) throw error; }
