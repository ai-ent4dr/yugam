export type FuturePlanningInputs = {
  relationshipGoalA?: string;
  relationshipGoalB?: string;
  careerGoalA?: string;
  careerGoalB?: string;
  sharedValues?: string[];
  compatibilityScore: number;
};

export function extractFutureThemes(input: FuturePlanningInputs): string[] {
  const themes: string[] = [];

  if (input.compatibilityScore >= 80) {
    themes.push("Shared long-term vision offers strong momentum for mutual goal attainment.");
  } else {
    themes.push("Intentional milestones and open communication will be crucial in navigating differing expectations.");
  }

  if (input.careerGoalA && input.careerGoalB) {
    themes.push("Harmonizing two active careers requires establishing clear mutual support agreements.");
  }

  themes.push("Consider developing shared financial principles and annual travel/life-direction checkpoints.");
  themes.push("Embrace change with mutual curiosity, ensuring each partner feels valued and heard.");

  return themes;
}
