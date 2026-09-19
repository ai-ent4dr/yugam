import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getAllStoredAnalyses } from "@/lib/analysis-store";
import UsersTable, { type ProfileRecord } from "./users-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const profilesList: ProfileRecord[] = [];
  const seenPeopleKeys = new Set<string>();

  // 1. Fetch Supabase Auth accounts & searched individuals if configured
  if (isSupabaseAdminConfigured()) {
    try {
      const adminDb = createAdminClient();
      const { data: authData } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 100 });
      const { data: profiles } = await adminDb.from("profiles").select("user_id, name, city, created_at");
      const { data: analyses } = await adminDb.from("analyses").select("owner_user_id");

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const counts: Record<string, number> = {};
      for (const a of analyses ?? []) {
        if (a.owner_user_id) counts[a.owner_user_id] = (counts[a.owner_user_id] || 0) + 1;
      }

      for (const u of authData?.users ?? []) {
        const p = profileMap.get(u.id);
        const name = p?.name || u.email?.split("@")[0] || "User";
        profilesList.push({
          id: u.id,
          name,
          email: u.email,
          city: p?.city || "—",
          createdAt: u.created_at,
          analysisCount: counts[u.id] || 0,
          status: u.confirmed_at ? "active" : "unconfirmed",
          source: "account",
        });
      }

      // Fetch searched individuals from Supabase analysis_people
      const { data: supabasePeople } = await adminDb
        .from("analysis_people")
        .select(`
          id,
          analysis_id,
          person_role,
          name,
          gender,
          dob,
          birth_place,
          city,
          relationship_goal,
          created_at,
          analyses (id, created_at)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (supabasePeople && supabasePeople.length > 0) {
        const peopleByAnalysis = new Map<string, any[]>();
        for (const sp of supabasePeople) {
          if (!peopleByAnalysis.has(sp.analysis_id)) {
            peopleByAnalysis.set(sp.analysis_id, []);
          }
          peopleByAnalysis.get(sp.analysis_id)!.push(sp);
        }

        const { data: uploadsData } = await adminDb
          .from("uploads")
          .select("analysis_id, storage_path, type");

        const uploadsByAnalysis = new Map<string, string>();
        for (const u of uploadsData ?? []) {
          if (u.type === "profile_photo" || u.storage_path.includes("profile")) {
            const role = u.storage_path.includes("person-b") ? "B" : "A";
            uploadsByAnalysis.set(`${u.analysis_id}-${role}`, u.storage_path);
          }
        }

        for (const sp of supabasePeople) {
          const peers = peopleByAnalysis.get(sp.analysis_id) || [];
          const partner = peers.find((p) => p.id !== sp.id);
          const photo = uploadsByAnalysis.get(`${sp.analysis_id}-${sp.person_role}`);
          const dedupeKey = `${sp.analysis_id}-${sp.name.toLowerCase()}`;
          seenPeopleKeys.add(dedupeKey);

          profilesList.push({
            id: `sb-${sp.id}`,
            name: sp.name,
            gender: sp.gender,
            dob: sp.dob,
            birthPlace: sp.birth_place,
            city: sp.city,
            relationshipGoal: sp.relationship_goal,
            partnerName: partner?.name,
            analysisId: sp.analysis_id,
            createdAt: sp.created_at || (sp.analyses as any)?.created_at || new Date().toISOString(),
            source: "analysis_person",
            profilePhotoPath: photo,
          });
        }
      }
    } catch {
      // Local dev fallback
    }
  }

  // 2. Extract every searched individual from stored analyses (local fallback)
  const allAnalyses = getAllStoredAnalyses();
  for (const a of allAnalyses) {
    const pA = a.personA;
    const pB = a.personB;

    if (pA?.name) {
      const dedupeKeyA = `${a.id}-${pA.name.toLowerCase()}`;
      if (!seenPeopleKeys.has(dedupeKeyA)) {
        seenPeopleKeys.add(dedupeKeyA);
        profilesList.push({
          id: `pA-${a.id}`,
          name: pA.name,
          gender: pA.gender,
          dob: pA.dob,
          birthPlace: pA.birthPlace,
          city: pA.city,
          relationshipGoal: pA.relationshipGoal,
          partnerName: pB?.name,
          analysisId: a.id,
          createdAt: a.createdAt || new Date().toISOString(),
          source: "analysis_person",
          profilePhotoPath: pA.profilePhotoPath,
        });
      }
    }

    if (pB?.name) {
      const dedupeKeyB = `${a.id}-${pB.name.toLowerCase()}`;
      if (!seenPeopleKeys.has(dedupeKeyB)) {
        seenPeopleKeys.add(dedupeKeyB);
        profilesList.push({
          id: `pB-${a.id}`,
          name: pB.name,
          gender: pB.gender,
          dob: pB.dob,
          birthPlace: pB.birthPlace,
          city: pB.city,
          relationshipGoal: pB.relationshipGoal,
          partnerName: pA?.name,
          analysisId: a.id,
          createdAt: a.createdAt || new Date().toISOString(),
          source: "analysis_person",
          profilePhotoPath: pB.profilePhotoPath,
        });
      }
    }
  }

  // Sort newest first
  profilesList.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
          <span className="tag">ADMIN</span>
        </a>
        <div className="nav-links">
          <a href="/admin">Dashboard</a>
          <a href="/admin/analyses">Analyses</a>
          <a href="/account">Account</a>
          <a href="/">Home</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">USER & PROFILE DIRECTORY</p>
        <h1 style={{ fontSize: "32px" }}>Profiles & Searched Names ({profilesList.length})</h1>
        <p className="lead" style={{ fontSize: "15px" }}>
          Instant search and directory of all registered platform users and searched couple profiles.
        </p>
      </div>

      <div className="panel">
        <UsersTable initialProfiles={profilesList} />
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
