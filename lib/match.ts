export type Profile = {
  id?: string; name: string; dob: string; gender: "male" | "female" | "other";
  city: string; education: string; career: string; relationshipGoal: string;
  lifestyle: string[]; values: string[]; careerGoal: string; photoUrl?: string;
};

const overlap = (a: string[], b: string[]) => {
  const A = new Set(a.map(x => x.toLowerCase()));
  return b.filter(x => A.has(x.toLowerCase())).length;
};

const age = (dob: string) => {
  const d = new Date(dob), now = new Date();
  let n = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) n--;
  return n;
};

export function calculateMatch(a: Profile, b: Profile) {
  const ageGap = Math.abs(age(a.dob) - age(b.dob));
  const ageScore = Math.max(0, 100 - ageGap * 12);
  const cityScore = a.city.toLowerCase() === b.city.toLowerCase() ? 100 : 55;
  const valueScore = Math.min(100, overlap(a.values, b.values) * 25);
  const lifestyleScore = Math.min(100, overlap(a.lifestyle, b.lifestyle) * 25);
  const careerScore = a.careerGoal === b.careerGoal ? 100 : 65;
  const relationshipScore = a.relationshipGoal === b.relationshipGoal ? 100 : 35;
  const educationScore = a.education === b.education ? 100 : 70;
  const score = Math.round(
    ageScore * .15 + cityScore * .10 + valueScore * .25 + lifestyleScore * .15 +
    careerScore * .15 + relationshipScore * .15 + educationScore * .05
  );
  return { score, breakdown: {
    values: Math.round(valueScore), lifestyle: Math.round(lifestyleScore),
    career: Math.round(careerScore), relationship: Math.round(relationshipScore),
    age: Math.round(ageScore), location: Math.round(cityScore), education: Math.round(educationScore)
  }};
}

export function entertainmentPalmNote() {
  return "Palm/hand reading is optional entertainment and is not evidence about compatibility, health, personality, or future predictions.";
}