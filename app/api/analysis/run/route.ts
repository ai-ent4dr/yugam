import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { analysisSchema } from "@/lib/validation";
import { calculateMatch } from "@/lib/match";
import { canRunAnalysis, getRemainingFreeAnalyses, incrementUsage } from "@/lib/usage";
import { rateLimit } from "@/lib/rate-limit";
import { numerologyCompatibility, numerologyFor } from "@/lib/calculations/numerology";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin"); if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const jar = await cookies(); const session = jar.get("yugma_session")?.value ?? crypto.randomUUID();
  if (!rateLimit(session, 8)) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  const parsed = analysisSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Please complete the required details and consent." }, { status: 400 });
  try {
    if (!await canRunAnalysis(session)) return NextResponse.json({ error: "Your free readings are complete.", signupRequired: true }, { status: 403 });
    const { personA, personB, modules } = parsed.data;
    const match = calculateMatch({ ...personA, city: personA.city ?? personA.birthPlace, education: personA.education ?? "", career: personA.career ?? "", careerGoal: personA.careerGoal ?? "" }, { ...personB, city: personB.city ?? personB.birthPlace, education: personB.education ?? "", career: personB.career ?? "", careerGoal: personB.careerGoal ?? "" });
    await incrementUsage(session); const remaining = await getRemainingFreeAnalyses(session); const numberA = numerologyFor(personA.name, personA.dob); const numberB = numerologyFor(personB.name, personB.dob);
    const response = NextResponse.json({ match, remaining, modules, reading: { summary: "This compatibility estimate compares the relationship preferences you provided.", positives: "Shared preferences can be a useful starting point for conversation.", challenges: "Different priorities deserve open, respectful discussion.", suggestions: "Discuss expectations, boundaries, communication and long-term goals directly.", interpretive: modules.includes("jataka") ? "Jataka-style content is a generalized cultural interpretation; exact chart calculations require an appropriate astrology engine and no planetary positions were calculated." : null, numerology: modules.includes("numerology") ? numerologyCompatibility(numberA, numberB) : null, disclaimer: "This is an AI-generated compatibility estimate based on the information provided. Traditional astrology, numerology and palmistry sections are interpretive and are not scientific predictions." } });
    if (!jar.get("yugma_session")) response.cookies.set("yugma_session", session, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 90 }); return response;
  } catch (error) { console.error("Analysis generation failed", error instanceof Error ? error.message : "Unknown error"); const setupMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY; return NextResponse.json({ error: setupMissing ? "The service has not been configured yet. Add the Supabase environment variables and try again." : "The analysis could not be generated. Please try again." }, { status: 500 }); }
}
