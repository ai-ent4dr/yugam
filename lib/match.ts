import {
  calculateCompatibility,
  type PersonProfile,
  type CompatibilityBreakdown,
  type CompatibilityResult,
} from "@/lib/calculations/compatibility";

export type Profile = PersonProfile & {
  id?: string;
  careerGoal: string;
  photoUrl?: string;
};

export function calculateMatch(a: Profile, b: Profile) {
  const res = calculateCompatibility(a, b);
  return {
    score: res.score,
    breakdown: {
      values: res.breakdown.values,
      lifestyle: res.breakdown.lifestyle,
      career: res.breakdown.careerGoals,
      relationship: res.breakdown.relationshipGoals,
      age: res.breakdown.ageCompatibility,
      location: res.breakdown.location,
      education: res.breakdown.educationInterests,
    },
    label: res.label,
    summary: res.summary,
    strengths: res.strengths,
    challenges: res.challenges,
    practicalSuggestions: res.practicalSuggestions,
  };
}

export function entertainmentPalmNote() {
  return "Palm and hand observations are interpretive cultural readings for entertainment only and are not evidence regarding personality, health, compatibility, or future predictions.";
}

export { calculateCompatibility, type PersonProfile, type CompatibilityBreakdown, type CompatibilityResult };