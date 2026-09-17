export type NumerologyReading = {
  lifePath: number;
  nameNumber: number;
  label: string;
  archetype: string;
  summary: string;
};

// Standard Pythagorean chart
const LETTER_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const ARCHETYPES: Record<number, { title: string; theme: string }> = {
  1: { title: "The Pioneer", theme: "Independence, initiative, and visionary drive." },
  2: { title: "The Harmonizer", theme: "Diplomacy, empathy, and supportive partnership." },
  3: { title: "The Communicator", theme: "Creativity, self-expression, and joy." },
  4: { title: "The Builder", theme: "Structure, dependability, and solid foundations." },
  5: { title: "The Explorer", theme: "Adaptability, freedom, and dynamic change." },
  6: { title: "The Nurturer", theme: "Responsibility, community care, and warmth." },
  7: { title: "The Seeker", theme: "Contemplation, inner wisdom, and analytical depth." },
  8: { title: "The Achiever", theme: "Manifestation, balance of power, and resilience." },
  9: { title: "The Humanitarian", theme: "Compassion, broad perspective, and generosity." },
  11: { title: "The Intuitive Master", theme: "Heightened insight, spiritual empathy, and inspiration." },
  22: { title: "The Master Architect", theme: "Transforming ambitious ideas into lasting reality." },
};

function reduceNumber(value: number): number {
  while (value > 9 && value !== 11 && value !== 22) {
    value = String(value)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return value;
}

export function calculateLifePath(dob: string): number {
  const digits = (dob.match(/\d/g) ?? []).map(Number);
  if (!digits.length) return 1;
  const rawSum = digits.reduce((a, b) => a + b, 0);
  return reduceNumber(rawSum);
}

export function calculateNameNumber(name: string): number {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (!clean.length) return 1;
  let total = 0;
  for (const char of clean) {
    total += LETTER_VALUES[char] || 0;
  }
  return reduceNumber(total);
}

export function numerologyFor(name: string, dob: string): NumerologyReading {
  const lifePath = calculateLifePath(dob);
  const nameNumber = calculateNameNumber(name);
  const info = ARCHETYPES[lifePath] || { title: "The Voyager", theme: "Self-discovery and evolution." };

  return {
    lifePath,
    nameNumber,
    label: "Numerology-style interpretation",
    archetype: info.title,
    summary: `Life-path style number ${lifePath} ("${info.title}") reflects themes of ${info.theme.toLowerCase()} Name-number expression value is ${nameNumber}.`,
  };
}

export function numerologyCompatibility(a: NumerologyReading, b: NumerologyReading) {
  const diff = Math.abs(a.lifePath - b.lifePath);
  let dynamics = "";

  if (diff === 0) {
    dynamics = "Identical life-path values suggest naturally resonant viewpoints and instinctive mutual understanding.";
  } else if (diff === 1 || diff === 2) {
    dynamics = "Adjacent life-path values provide a balanced blend of shared rhythm and fresh perspectives.";
  } else if ((a.lifePath === 1 && b.lifePath === 2) || (a.lifePath === 2 && b.lifePath === 1)) {
    dynamics = "Complementary interplay: one provides direction and initiative while the other brings cohesion and emotional harmony.";
  } else if (a.lifePath === 11 || b.lifePath === 11 || a.lifePath === 22 || b.lifePath === 22) {
    dynamics = "Presence of a master-vibration number highlights intuitive depth and purposeful shared aspirations.";
  } else {
    dynamics = "Contrasting numbers bring diverse styles of problem-solving, making intentional communication especially rewarding.";
  }

  return {
    personALifePath: a.lifePath,
    personANameNumber: a.nameNumber,
    personAArchetype: a.archetype,
    personBLifePath: b.lifePath,
    personBNameNumber: b.nameNumber,
    personBArchetype: b.archetype,
    dynamics,
    disclaimer: "Numerology-style interpretation is an interpretive cultural tradition for reflection and entertainment, not a scientific assessment.",
  };
}
