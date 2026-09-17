import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

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

  // Optionally record in database if configured
  try {
    const db = createAdminClient();
    await db.from("analyses").insert({
      id: analysisId,
      owner_user_id: userId,
      session_id: session,
      status: "draft",
    });
  } catch {
    // Development fallback
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
