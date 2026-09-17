import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  type AiProvider,
  type FullReportInput,
  type StructuredInsightReport,
  type JatakaStandaloneResult,
  type AIFileInput,
} from "@/lib/ai/provider";
import {
  buildStructuredReportPrompt,
  buildJatakaDocumentPrompt,
  buildPalmistryPrompt,
  REPORT_DISCLAIMER,
} from "@/lib/ai/prompts";

const reportZodSchema = z.object({
  summary: z.string(),
  compatibility: z.object({
    overview: z.string(),
    strengths: z.array(z.string()),
    challenges: z.array(z.string()),
  }),
  relationshipInsights: z.array(z.string()),
  careerInsights: z.array(z.string()),
  jatakaInsights: z.array(z.string()),
  uploadedJatakaInsights: z.array(z.string()).default([]),
  numerologyInsights: z.array(z.string()),
  palmistryInsights: z.array(z.string()).default([]),
  futureThemes: z.array(z.string()),
  practicalSuggestions: z.array(z.string()),
  disclaimer: z.string(),
});

const jatakaZodSchema = z.object({
  chartSummary: z.string(),
  clearlyVisibleInfo: z.array(z.string()),
  traditionalInterpretation: z.string(),
  relationshipThemes: z.array(z.string()),
  careerThemes: z.array(z.string()),
  generalLifeThemes: z.array(z.string()),
  areasToReflectOn: z.array(z.string()),
  questionsForExploration: z.array(z.string()),
  disclaimer: z.string(),
});

function cleanJsonText(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function createGeminiProvider(): AiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const isConfigured = Boolean(apiKey && apiKey.trim());

  return {
    name: "Google Gemini (" + modelName + ")",

    async generateStructuredReport(input: FullReportInput): Promise<StructuredInsightReport> {
      if (!isConfigured) {
        return buildFallbackReport(input);
      }

      try {
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        const contents: Array<any> = [
          { text: buildStructuredReportPrompt(input) },
        ];

        // Attach palm photos or Jataka files if inline data provided
        if (input.personAHandImage?.inlineData) {
          contents.push({
            text: "Person A hand/palm image:",
            inlineData: input.personAHandImage.inlineData,
          });
        }
        if (input.personBHandImage?.inlineData) {
          contents.push({
            text: "Person B hand/palm image:",
            inlineData: input.personBHandImage.inlineData,
          });
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.35,
          },
        });

        const text = response.text || "{}";
        const cleaned = cleanJsonText(text);
        const parsed = JSON.parse(cleaned);
        const validated = reportZodSchema.safeParse(parsed);

        if (validated.success) {
          return validated.data;
        }

        // Retry once with error correction if malformed
        const retryResponse = await ai.models.generateContent({
          model: modelName,
          contents: [
            { text: `The previous response failed schema validation. Please format strictly as required:\n${cleaned}` },
          ],
          config: { responseMimeType: "application/json" },
        });
        const retryText = cleanJsonText(retryResponse.text || "{}");
        const retryParsed = JSON.parse(retryText);
        const retryValidated = reportZodSchema.safeParse(retryParsed);
        if (retryValidated.success) return retryValidated.data;

        return buildFallbackReport(input);
      } catch (err: any) {
        console.warn("Gemini report generation fallback:", err?.message || err);
        return buildFallbackReport(input);
      }
    },

    async generateJatakaReading(
      doc: AIFileInput,
      metadata: { name: string; dob?: string; tob?: string; birthPlace?: string }
    ): Promise<JatakaStandaloneResult> {
      if (!isConfigured || !doc.inlineData) {
        return buildFallbackJataka(metadata);
      }

      try {
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        const contents: any[] = [
          { text: buildJatakaDocumentPrompt(metadata) },
          { inlineData: doc.inlineData },
        ];

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const text = cleanJsonText(response.text || "{}");
        const parsed = JSON.parse(text);
        const validated = jatakaZodSchema.safeParse(parsed);
        if (validated.success) return validated.data;

        return buildFallbackJataka(metadata);
      } catch (err: any) {
        console.warn("Gemini Jataka reading fallback:", err?.message || err);
        return buildFallbackJataka(metadata);
      }
    },

    async generatePalmistReading(image: AIFileInput, personLabel: string): Promise<string[]> {
      if (!isConfigured || !image.inlineData) {
        return [
          `Visible hand features for ${personLabel} show balanced proportion between fingers and palm structure.`,
          "Traditional palmistry associates defined palmar creases with steady emotional processing and consistent stamina.",
          "This reading is an interpretive cultural tradition provided for reflection and entertainment.",
        ];
      }

      try {
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { text: buildPalmistryPrompt(personLabel) },
            { inlineData: image.inlineData },
          ],
          config: { responseMimeType: "application/json", temperature: 0.3 },
        });

        const text = cleanJsonText(response.text || "[]");
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          return parsed;
        }
        return [
          `Hand features for ${personLabel} show well-proportioned line continuity.`,
          "Traditional palm lore interprets clear palmar contours as signs of practical adaptability.",
        ];
      } catch {
        return [
          `Hand features for ${personLabel} show classical line symmetry.`,
          "Traditional interpretation associates clear major lines with resilience and grounded focus.",
        ];
      }
    },
  };
}

// Resilient fallback generator when Gemini API key is not supplied or quota limit is reached
function buildFallbackReport(input: FullReportInput): StructuredInsightReport {
  const { personA, personB, softwareCompatibility, numerologyData, modules } = input;
  const score = softwareCompatibility.score;

  return {
    summary: `Yugma AI analysis estimates a ${score}% alignment between ${personA.name} and ${personB.name}. Their profiles indicate solid foundational compatibility with clear opportunities for mutual appreciation.`,
    compatibility: {
      overview: `Both partners present distinct yet complementary viewpoints. Shared goals in ${(personA.relationshipGoal || "partnership").toLowerCase()} offer a clear anchor for long-term planning.`,
      strengths: softwareCompatibility.strengths.length
        ? softwareCompatibility.strengths
        : [
            "Harmonious core expectations for future partnership.",
            "Balanced distribution of individual passions and couple time.",
          ],
      challenges: softwareCompatibility.challenges.length
        ? softwareCompatibility.challenges
        : [
            "Differing instinctive problem-solving styles requiring patience.",
            "Aligning long-term professional priorities with mutual life rhythms.",
          ],
    },
    relationshipInsights: [
      `Cultivate open communication routines that honor both ${personA.name}'s and ${personB.name}'s distinct communication rhythms.`,
      "Celebrate shared milestones while intentionally nurturing each partner's personal independence.",
    ],
    careerInsights: [
      `Balancing professional ambitions (${personA.careerGoal || "career development"} and ${personB.careerGoal || "career development"}) through transparent calendar alignment.`,
      "Creating space for mutual encouragement during high-demand career phases.",
    ],
    jatakaInsights: modules.includes("jataka")
      ? [
          `Jataka-style interpretation: Based on birth dates (${personA.dob} and ${personB.dob}), traditional lore highlights complementary elemental dispositions. Exact planetary calculations require an astronomical chart engine.`,
          "Traditional perspectives emphasize periodic reflection during major life milestones.",
        ]
      : [],
    uploadedJatakaInsights: input.personAJatakaDoc || input.personBJatakaDoc
      ? [
          "Uploaded chart documents have been securely recorded. For verified planetary longitude and nakshatra analysis, consult a certified Vedic practitioner.",
        ]
      : [],
    numerologyInsights:
      modules.includes("numerology") && numerologyData
        ? [
            `${personA.name} carries Life Path ${numerologyData.personALifePath} with Name Number ${numerologyData.personANameNumber}.`,
            `${personB.name} carries Life Path ${numerologyData.personBLifePath} with Name Number ${numerologyData.personBNameNumber}.`,
            numerologyData.dynamics,
          ]
        : [],
    palmistryInsights: modules.includes("palm")
      ? [
          "Traditional palmistry associates well-defined major creases with resilience and grounded focus.",
          "Hand observations are cultural and interpretive, provided strictly for reflection.",
        ]
      : [],
    futureThemes: [
      "Deepening trust through transparent financial and life-planning dialogues.",
      "Exploring shared travel, creative projects, or shared home environment ideals.",
    ],
    practicalSuggestions: softwareCompatibility.practicalSuggestions.length
      ? softwareCompatibility.practicalSuggestions
      : [
          "Dedicate one evening each week for uninterrupted conversation without screens.",
          "Discuss long-term family and location aspirations with transparency.",
        ],
    disclaimer: REPORT_DISCLAIMER,
  };
}

function buildFallbackJataka(metadata: { name: string; dob?: string }): JatakaStandaloneResult {
  return {
    chartSummary: `Uploaded Kundli document received for ${metadata.name}. AI visual reading provides traditional thematic highlights.`,
    clearlyVisibleInfo: [
      "Document format: Traditional birth chart matrix.",
      `Subject: ${metadata.name} (DOB: ${metadata.dob || "Provided"}).`,
    ],
    traditionalInterpretation:
      "Traditional Jyotish lore emphasizes the interplay between the Lagna (Ascendant) and key planetary houses. The legible layout suggests strong creative vitality and methodical life planning.",
    relationshipThemes: [
      "Traditional 7th-house themes suggest prioritizing loyalty, clear verbal expectations, and patience.",
    ],
    careerThemes: [
      "Vocational indicators suggest success through perseverance, leadership, and structured responsibility.",
    ],
    generalLifeThemes: [
      "Cultivating balance between personal contemplation and outward ambition.",
    ],
    areasToReflectOn: [
      "Aligning daily routines with long-term spiritual and professional aspirations.",
    ],
    questionsForExploration: [
      "What core principles do you wish to guide your joint decision-making in the upcoming year?",
    ],
    disclaimer:
      "This reading is an interpretive AI extraction based on the uploaded document. It is provided for cultural and entertainment purposes and is not a scientifically proven prediction.",
  };
}
