import { createGeminiProvider } from "@/lib/ai/gemini";
import type { AIFileInput } from "@/lib/ai/provider";

export async function analyzePalmImage(image: AIFileInput, personLabel: string): Promise<string[]> {
  const provider = createGeminiProvider();
  return provider.generatePalmistReading(image, personLabel);
}
