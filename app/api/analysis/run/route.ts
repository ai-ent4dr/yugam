import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { analysisSchema } from "@/lib/validation";
import { calculateCompatibility } from "@/lib/calculations/compatibility";
import { numerologyFor, numerologyCompatibility } from "@/lib/calculations/numerology";
import { canRunAnalysis, getRemainingFreeAnalyses, incrementUsage } from "@/lib/usage";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { generateCompatibilityReport } from "@/lib/ai/compatibility";
import { extractFutureThemes } from "@/lib/ai/future";
import { REPORT_DISCLAIMER } from "@/lib/ai/prompts";
import { STORAGE_BUCKET } from "@/lib/config";
import { localAnalysisStore, saveStoredAnalysis, getLocalUpload } from "@/lib/analysis-store";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const jar = await cookies();
  let session = jar.get("yugma_session")?.value;
  const isNew = !session;
  session ??= crypto.randomUUID();

  const ip = request.headers.get("x-forwarded-for") ?? session;
  if (!rateLimit(`analysis:${ip}`, 8)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = analysisSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Please complete the required details and consent.";
    return NextResponse.json({ error: issue }, { status: 400 });
  }

  let authenticatedUser: { id: string; email?: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) authenticatedUser = data.user;
  } catch {
    // Unauthenticated
  }

  // Check free usage limit for anonymous users (authenticated users bypass free limit)
  if (!authenticatedUser) {
    const allowed = await canRunAnalysis(session);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Your free readings are complete. Create your free account to continue.",
          signupRequired: true,
        },
        { status: 403 }
      );
    }
  }

  const { personA, personB, modules, consent } = parsed.data;
  const analysisId = parsed.data.analysisId || crypto.randomUUID();

  try {
    // 1. Deterministic software calculations (Strictly independent of attractiveness or sensitive traits)
    const match = calculateCompatibility(personA, personB);

    // 2. Deterministic numerology calculations
    const numA = numerologyFor(personA.name, personA.dob);
    const numB = numerologyFor(personB.name, personB.dob);
    const numCompat = numerologyCompatibility(numA, numB);

    // 3. Prepare AI inputs & retrieve any uploaded hand or Jataka files from local storage or Supabase
    async function getMediaBuffer(storagePath?: string): Promise<Buffer | null> {
      if (!storagePath) return null;
      try {
        const local = await getLocalUpload(storagePath);
        if (local?.buffer) return local.buffer;
      } catch {
        // local lookup error
      }

      if (isSupabaseAdminConfigured()) {
        try {
          const adminDb = createAdminClient();
          const { data } = await adminDb.storage.from(STORAGE_BUCKET).download(storagePath);
          if (data) return Buffer.from(await data.arrayBuffer());
        } catch {
          // ignore
        }
      }
      return null;
    }

    let personAHandInline: any = undefined;
    let personBHandInline: any = undefined;
    let personAJatakaInline: any = undefined;
    let personBJatakaInline: any = undefined;

    const bufAHand = await getMediaBuffer(personA.handPhotoPath);
    if (bufAHand) {
      personAHandInline = {
        inlineData: { mimeType: "image/jpeg", data: bufAHand.toString("base64") },
      };
    }

    const bufBHand = await getMediaBuffer(personB.handPhotoPath);
    if (bufBHand) {
      personBHandInline = {
        inlineData: { mimeType: "image/jpeg", data: bufBHand.toString("base64") },
      };
    }

    const bufAJataka = await getMediaBuffer(personA.jatakaPath);
    if (bufAJataka) {
      const isPdf = personA.jatakaPath?.endsWith(".pdf");
      personAJatakaInline = {
        inlineData: {
          mimeType: isPdf ? "application/pdf" : "image/jpeg",
          data: bufAJataka.toString("base64"),
        },
      };
    }

    const bufBJataka = await getMediaBuffer(personB.jatakaPath);
    if (bufBJataka) {
      const isPdf = personB.jatakaPath?.endsWith(".pdf");
      personBJatakaInline = {
        inlineData: {
          mimeType: isPdf ? "application/pdf" : "image/jpeg",
          data: bufBJataka.toString("base64"),
        },
      };
    }

    // 4. Generate structured AI report with Google Gemini SDK
    const aiReport = await generateCompatibilityReport({
      personA: {
        ...personA,
        hasProfilePhoto: Boolean(personA.profilePhotoPath),
        hasHandPhoto: Boolean(personA.handPhotoPath),
        hasJataka: Boolean(personA.jatakaPath),
      },
      personB: {
        ...personB,
        hasProfilePhoto: Boolean(personB.profilePhotoPath),
        hasHandPhoto: Boolean(personB.handPhotoPath),
        hasJataka: Boolean(personB.jatakaPath),
      },
      softwareCompatibility: match,
      numerologyData: {
        personALifePath: numA.lifePath,
        personANameNumber: numA.nameNumber,
        personBLifePath: numB.lifePath,
        personBNameNumber: numB.nameNumber,
        dynamics: numCompat.dynamics,
      },
      modules,
      personAHandImage: personAHandInline,
      personBHandImage: personBHandInline,
      personAJatakaDoc: personAJatakaInline,
      personBJatakaDoc: personBJatakaInline,
    });

    // 5. Future planning considerations
    const futureThemes = extractFutureThemes({
      relationshipGoalA: personA.relationshipGoal,
      relationshipGoalB: personB.relationshipGoal,
      careerGoalA: personA.careerGoal,
      careerGoalB: personB.careerGoal,
      compatibilityScore: match.score,
    });

    // 6. Record usage for anonymous users
    if (!authenticatedUser) {
      await incrementUsage(session);
    }
    const remaining = await getRemainingFreeAnalyses(session);

    // 7. Persist structured records into Supabase PostgreSQL
    const completeAnalysisRecord = {
      id: analysisId,
      ownerUserId: authenticatedUser?.id ?? null,
      sessionId: session,
      status: "completed",
      personA,
      personB,
      match,
      numerology: { personA: numA, personB: numB, compatibility: numCompat },
      aiReport,
      futureThemes,
      modules,
      createdAt: new Date().toISOString(),
    };

    // Store in local persistent storage & memory cache
    saveStoredAnalysis(analysisId, completeAnalysisRecord);

    if (isSupabaseAdminConfigured()) {
      try {
        const adminDb = createAdminClient();

        // Upsert analysis header
        await adminDb.from("analyses").upsert({
        id: analysisId,
        owner_user_id: authenticatedUser?.id ?? null,
        session_id: session,
        status: "completed",
        analysis_type: modules,
        free_or_paid: "free",
        updated_at: new Date().toISOString(),
      });

      // Insert People
      const { data: peopleData } = await adminDb
        .from("analysis_people")
        .insert([
          {
            analysis_id: analysisId,
            person_role: "A",
            name: personA.name,
            gender: personA.gender,
            dob: personA.dob,
            tob: personA.tob || null,
            birth_place: personA.birthPlace,
            city: personA.city || null,
            relationship_goal: personA.relationshipGoal || null,
            career_goal: personA.careerGoal || null,
            values: personA.values || [],
            lifestyle: personA.lifestyle || [],
            consent_confirmed: true,
          },
          {
            analysis_id: analysisId,
            person_role: "B",
            name: personB.name,
            gender: personB.gender,
            dob: personB.dob,
            tob: personB.tob || null,
            birth_place: personB.birthPlace,
            city: personB.city || null,
            relationship_goal: personB.relationshipGoal || null,
            career_goal: personB.careerGoal || null,
            values: personB.values || [],
            lifestyle: personB.lifestyle || [],
            consent_confirmed: true,
          },
        ])
        .select();

      // Insert compatibility results
      await adminDb.from("compatibility_results").upsert({
        analysis_id: analysisId,
        overall_score: match.score,
        values_score: match.breakdown.values,
        relationship_score: match.breakdown.relationshipGoals,
        lifestyle_score: match.breakdown.lifestyle,
        career_score: match.breakdown.careerGoals,
        age_score: match.breakdown.ageCompatibility,
        location_score: match.breakdown.location,
        education_score: match.breakdown.educationInterests,
        explanation: {
          strengths: match.strengths,
          challenges: match.challenges,
          practicalSuggestions: match.practicalSuggestions,
        },
      });

      // Insert Readings
      if (modules.includes("jataka") || aiReport.jatakaInsights.length) {
        await adminDb.from("jataka_readings").insert({
          analysis_id: analysisId,
          reading_data: { insights: aiReport.jatakaInsights, uploaded: aiReport.uploadedJatakaInsights },
          model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
        });
      }

      if (modules.includes("numerology")) {
        await adminDb.from("numerology_readings").insert({
          analysis_id: analysisId,
          reading_data: { insights: aiReport.numerologyInsights, dynamics: numCompat.dynamics },
          life_path_a: numA.lifePath,
          life_path_b: numB.lifePath,
          name_number_a: numA.nameNumber,
          name_number_b: numB.nameNumber,
          model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
        });
      }

      if (modules.includes("palm") || aiReport.palmistryInsights.length) {
        await adminDb.from("palm_readings").insert({
          analysis_id: analysisId,
          reading_data: { insights: aiReport.palmistryInsights },
          model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
        });
      }

      await adminDb.from("future_readings").insert({
        analysis_id: analysisId,
        reading_data: { futureThemes, careerInsights: aiReport.careerInsights },
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      });

      // Insert consent record
      await adminDb.from("consents").insert({
        analysis_id: analysisId,
        user_id: authenticatedUser?.id ?? null,
        consent_text_version: "1.0",
      });
      } catch (dbErr) {
        console.warn("Database storage skipped (local fallback mode active):", dbErr);
      }
    }

    const response = NextResponse.json({
      success: true,
      analysisId,
      match,
      remaining,
      modules,
      aiReport,
      numerology: {
        personA: numA,
        personB: numB,
        compatibility: numCompat,
      },
      futureThemes,
      disclaimer: REPORT_DISCLAIMER,
    });

    if (isNew) {
      response.cookies.set("yugma_session", session, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }

    return response;
  } catch (error) {
    console.error("Analysis generation error:", error);
    return NextResponse.json(
      { error: "The analysis could not be generated. Please try again." },
      { status: 500 }
    );
  }
}

export { localAnalysisStore };
