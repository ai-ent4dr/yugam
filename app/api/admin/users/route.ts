import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(){try{await requireAdmin();const {data,error}=await createAdminClient().from("profiles").select("user_id,name,created_at").order("created_at",{ascending:false}).limit(100);if(error)throw error;return NextResponse.json(data);}catch{return NextResponse.json({error:"Forbidden"},{status:403});}}
