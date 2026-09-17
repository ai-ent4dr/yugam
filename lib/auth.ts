import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/config";

export async function getCurrentUser() {
  try {
    const client = await createClient();
    const { data } = await client.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user) {
    if (user.email && ADMIN_EMAILS.has(user.email.toLowerCase())) return user;
    try {
      const client = await createClient();
      const { data } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      if (data) return user;
    } catch {
      // ignore
    }
    if (process.env.NODE_ENV !== "development") throw new Error("FORBIDDEN");
  }

  // In local development, permit access so developers can view submitted entries without login
  if (process.env.NODE_ENV === "development" || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { id: "dev-admin-id", email: "admin@local.dev" } as any;
  }

  throw new Error("UNAUTHORIZED");
}
