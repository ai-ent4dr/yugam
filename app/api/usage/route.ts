import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  let session = jar.get("yugma_session")?.value;
  const isNew = !session;
  session ??= crypto.randomUUID();

  const response = NextResponse.json({
    remaining: 999999,
    limit: 999999,
    unlimited: true,
  });

  if (isNew) {
    response.cookies.set("yugma_session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  }

  return response;
}
