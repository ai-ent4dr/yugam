import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/config";

export async function getCurrentUser() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  return data.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.email && ADMIN_EMAILS.has(user.email.toLowerCase())) return user;
  const client = await createClient();
  const { data } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) throw new Error("FORBIDDEN");
  return user;
}
