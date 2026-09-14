import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FREE_ANALYSIS_LIMIT } from "@/lib/config";
import { getRemainingFreeAnalyses } from "@/lib/usage";
import crypto from "crypto";
export async function GET() { const jar = await cookies(); let session = jar.get("yugma_session")?.value; const isNew = !session; session ??= crypto.randomUUID(); let remaining = FREE_ANALYSIS_LIMIT; try { remaining = await getRemainingFreeAnalyses(session); } catch { /* Database may not be configured during local UI development. */ } const response = NextResponse.json({ remaining, limit: FREE_ANALYSIS_LIMIT }); if (isNew) response.cookies.set("yugma_session", session, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 90, path: "/" }); return response; }
