import { COMPATIBILITY_WEIGHTS } from "@/lib/config";

export type PersonProfile = {
  name: string;
  gender: "male" | "female" | "other";
  dob: string;
  tob?: string;
  birthPlace: string;
  city?: string;
  education?: string;
  career?: string;
  relationshipGoal?: string;
  careerGoal?: string;
  values?: string[];
  lifestyle?: string[];
  interests?: string[];
};

export type CompatibilityBreakdown = {
  values: number;
  relationshipGoals: number;
  lifestyle: number;
  careerGoals: number;
  ageCompatibility: number;
  location: number;
  educationInterests: number;
};

export type CompatibilityResult = {
  score: number;
  label: string;
  breakdown: CompatibilityBreakdown;
  summary: string;
  strengths: string[];
  challenges: string[];
  practicalSuggestions: string[];
};

function calculateAge(dobString: string): number {
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return 25;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  return Math.max(18, years);
}

function calculateSetOverlap(a: string[] = [], b: string[] = []): { overlap: string[]; percentage: number } {
  if (!a.length && !b.length) return { overlap: [], percentage: 70 };
  const setA = new Set(a.map((s) => s.trim().toLowerCase()));
  const common = b.filter((s) => setA.has(s.trim().toLowerCase()));
  const totalUnique = new Set([...a, ...b].map((s) => s.trim().toLowerCase())).size;
  if (totalUnique === 0) return { overlap: [], percentage: 70 };
  const percentage = Math.min(100, Math.round((common.length / Math.max(1, Math.min(a.length, b.length))) * 100));
  return { overlap: common, percentage };
}

export function calculateCompatibility(a: PersonProfile, b: PersonProfile): CompatibilityResult {
  // 1. Values (25%)
  const valuesOverlap = calculateSetOverlap(a.values ?? [], b.values ?? []);
  const valuesScore = Math.max(45, valuesOverlap.percentage);

  // 2. Relationship goals (15%)
  const goalA = (a.relationshipGoal ?? "Marriage").trim().toLowerCase();
  const goalB = (b.relationshipGoal ?? "Marriage").trim().toLowerCase();
  let relationshipScore = 50;
  if (goalA === goalB) {
    relationshipScore = 100;
  } else if (
    (goalA.includes("marriage") && goalB.includes("long-term")) ||
    (goalA.includes("long-term") && goalB.includes("marriage"))
  ) {
    relationshipScore = 80;
  } else {
    relationshipScore = 40;
  }

  // 3. Lifestyle alignment (15%)
  const lifestyleOverlap = calculateSetOverlap(a.lifestyle ?? [], b.lifestyle ?? []);
  const lifestyleScore = Math.max(40, lifestyleOverlap.percentage);

  // 4. Career and future aspirations (15%)
  const careerA = (a.careerGoal ?? a.career ?? "").trim().toLowerCase();
  const careerB = (b.careerGoal ?? b.career ?? "").trim().toLowerCase();
  let careerScore = 65;
  if (careerA && careerB) {
    if (careerA === careerB) careerScore = 95;
    else careerScore = 75;
  }

  // 5. Age compatibility (15%)
  const ageA = calculateAge(a.dob);
  const ageB = calculateAge(b.dob);
  const ageDiff = Math.abs(ageA - ageB);
  const ageScore = Math.max(25, Math.min(100, 100 - ageDiff * 8));

  // 6. Location / city compatibility (10%)
  const cityA = (a.city || a.birthPlace || "").trim().toLowerCase();
  const cityB = (b.city || b.birthPlace || "").trim().toLowerCase();
  const locationScore = cityA && cityB && cityA === cityB ? 95 : 60;

  // 7. Education & interests compatibility (5%)
  const eduA = (a.education ?? "").trim().toLowerCase();
  const eduB = (b.education ?? "").trim().toLowerCase();
  const interestsOverlap = calculateSetOverlap(a.interests ?? [], b.interests ?? []);
  let eduScore = 70;
  if (eduA && eduB && eduA === eduB) eduScore = 90;
  if (interestsOverlap.overlap.length > 0) {
    eduScore = Math.min(100, eduScore + 10);
  }

  // Weighted overall calculation
  const totalScore = Math.round(
    valuesScore * COMPATIBILITY_WEIGHTS.values +
    relationshipScore * COMPATIBILITY_WEIGHTS.relationshipGoals +
    lifestyleScore * COMPATIBILITY_WEIGHTS.lifestyle +
    careerScore * COMPATIBILITY_WEIGHTS.careerGoals +
    ageScore * COMPATIBILITY_WEIGHTS.ageCompatibility +
    locationScore * COMPATIBILITY_WEIGHTS.location +
    eduScore * COMPATIBILITY_WEIGHTS.educationInterests
  );

  const breakdown: CompatibilityBreakdown = {
    values: Math.round(valuesScore),
    relationshipGoals: Math.round(relationshipScore),
    lifestyle: Math.round(lifestyleScore),
    careerGoals: Math.round(careerScore),
    ageCompatibility: Math.round(ageScore),
    location: Math.round(locationScore),
    educationInterests: Math.round(eduScore),
  };

  // Structured strengths & challenges based strictly on non-sensitive input data
  const strengths: string[] = [];
  const challenges: string[] = [];
  const practicalSuggestions: string[] = [];

  if (relationshipScore >= 80) {
    strengths.push("Harmonious shared relationship intentions and timeline expectations.");
  } else {
    challenges.push("Different initial pacing or stated relationship goals.");
    practicalSuggestions.push("Clarify commitment milestones and expectations early in the conversation.");
  }

  if (valuesScore >= 70 && valuesOverlap.overlap.length > 0) {
    strengths.push(`Mutual grounding in core values (${valuesOverlap.overlap.slice(0, 3).join(", ")}).`);
  } else {
    challenges.push("Divergent core priorities that require understanding and reciprocal respect.");
    practicalSuggestions.push("Discuss what matters most in day-to-day decision-making.");
  }

  if (lifestyleScore >= 70) {
    strengths.push("Comfortable day-to-day lifestyle and leisure compatibility.");
  } else {
    practicalSuggestions.push("Agree on boundaries between personal independence and couple time.");
  }

  if (locationScore >= 90) {
    strengths.push("Shared geographical proximity simplifies shared routines.");
  } else {
    challenges.push("Geographic distance or relocation considerations may arise.");
    practicalSuggestions.push("Explore long-term living arrangement preferences transparently.");
  }

  if (!strengths.length) {
    strengths.push("An opportunity to learn from distinct perspectives and complementary strengths.");
  }

  return {
    score: Math.min(99, Math.max(35, totalScore)),
    label: "Yugma Compatibility Estimate",
    breakdown,
    summary: `Based on the provided profiles, ${a.name || "Person A"} and ${b.name || "Person B"} show an estimated alignment of ${totalScore}%. This reflects shared preferences and self-reported values.`,
    strengths,
    challenges,
    practicalSuggestions,
  };
}
