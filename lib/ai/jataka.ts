import { createGeminiProvider } from "@/lib/ai/gemini";
import type { AIFileInput, JatakaStandaloneResult } from "@/lib/ai/provider";

export async function readJatakaDocument(
  doc: AIFileInput,
  metadata: { name: string; dob?: string; tob?: string; birthPlace?: string }
): Promise<JatakaStandaloneResult> {
  const provider = createGeminiProvider();
  return provider.generateJatakaReading(doc, metadata);
}
