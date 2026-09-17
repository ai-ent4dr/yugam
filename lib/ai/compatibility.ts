import { createGeminiProvider } from "@/lib/ai/gemini";
import type { FullReportInput, StructuredInsightReport } from "@/lib/ai/provider";

export async function generateCompatibilityReport(input: FullReportInput): Promise<StructuredInsightReport> {
  const provider = createGeminiProvider();
  return provider.generateStructuredReport(input);
}
