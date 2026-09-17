import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile: profile ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        name: body.name ?? null,
        gender: body.gender ?? null,
        dob: body.dob ? new Date(body.dob).toISOString().split("T")[0] : null,
        city: body.city ?? null,
        education: body.education ?? null,
        career: body.career ?? null,
        relationship_goal: body.relationshipGoal ?? null,
        future_goal: body.futureGoal ?? null,
        values: Array.isArray(body.values) ? body.values : [],
        lifestyle: Array.isArray(body.lifestyle) ? body.lifestyle : [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
