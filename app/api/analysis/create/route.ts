import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      const isLoopback = (h: string) => h.startsWith("localhost") || h.startsWith("127.0.0.1") || h.startsWith("192.168.");
      if (originHost !== host && !(isLoopback(originHost) && isLoopback(host))) {
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
      }
    } catch {
      // url parse fallback
    }
  }

  const jar = await cookies();
  let session = jar.get("yugma_session")?.value;
  const isNew = !session;
  session ??= crypto.randomUUID();

  const ip = request.headers.get("x-forwarded-for") ?? session;
  if (!rateLimit(ip, 20)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) userId = data.user.id;
  } catch {
    // Unauthenticated anonymous user
  }

  const analysisId = crypto.randomUUID();

  // Optionally record draft in database if configured
  if (isSupabaseAdminConfigured()) {
    try {
      const db = createAdminClient();
      await db.from("analyses").upsert(
        {
          id: analysisId,
          owner_user_id: userId,
          session_id: session,
          status: "draft",
        },
        { onConflict: "id" }
      );
    } catch (dbErr) {
      console.warn("Draft analysis registration skipped:", dbErr);
    }
  }

  const res = NextResponse.json({ analysisId, sessionId: session });
  if (isNew) {
    res.cookies.set("yugma_session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return res;
}
