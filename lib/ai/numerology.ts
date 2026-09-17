import {
  numerologyFor,
  numerologyCompatibility,
  type NumerologyReading,
} from "@/lib/calculations/numerology";

export function analyzeNumerology(
  personA: { name: string; dob: string },
  personB: { name: string; dob: string }
) {
  const readingA = numerologyFor(personA.name, personA.dob);
  const readingB = numerologyFor(personB.name, personB.dob);
  const compatibility = numerologyCompatibility(readingA, readingB);

  return {
    readingA,
    readingB,
    compatibility,
  };
}
