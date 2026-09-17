export type AIFileInput = {
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
  storagePath?: string;
  originalName?: string;
};

export type FullReportInput = {
  personA: {
    name: string;
    gender: string;
    dob: string;
    tob?: string;
    birthPlace: string;
    city?: string;
    relationshipGoal?: string;
    careerGoal?: string;
    values?: string[];
    lifestyle?: string[];
    hasProfilePhoto?: boolean;
    hasHandPhoto?: boolean;
    hasJataka?: boolean;
  };
  personB: {
    name: string;
    gender: string;
    dob: string;
    tob?: string;
    birthPlace: string;
    city?: string;
    relationshipGoal?: string;
    careerGoal?: string;
    values?: string[];
    lifestyle?: string[];
    hasProfilePhoto?: boolean;
    hasHandPhoto?: boolean;
    hasJataka?: boolean;
  };
  softwareCompatibility: {
    score: number;
    breakdown: Record<string, number>;
    strengths: string[];
    challenges: string[];
    practicalSuggestions: string[];
  };
  numerologyData?: {
    personALifePath: number;
    personANameNumber: number;
    personBLifePath: number;
    personBNameNumber: number;
    dynamics: string;
  };
  modules: string[];
  personAHandImage?: AIFileInput;
  personBHandImage?: AIFileInput;
  personAJatakaDoc?: AIFileInput;
  personBJatakaDoc?: AIFileInput;
};

export type StructuredInsightReport = {
  summary: string;
  compatibility: {
    overview: string;
    strengths: string[];
    challenges: string[];
  };
  relationshipInsights: string[];
  careerInsights: string[];
  jatakaInsights: string[];
  uploadedJatakaInsights: string[];
  numerologyInsights: string[];
  palmistryInsights: string[];
  futureThemes: string[];
  practicalSuggestions: string[];
  disclaimer: string;
};

export type JatakaStandaloneResult = {
  chartSummary: string;
  clearlyVisibleInfo: string[];
  traditionalInterpretation: string;
  relationshipThemes: string[];
  careerThemes: string[];
  generalLifeThemes: string[];
  areasToReflectOn: string[];
  questionsForExploration: string[];
  disclaimer: string;
};

export interface AiProvider {
  name: string;
  generateStructuredReport(input: FullReportInput): Promise<StructuredInsightReport>;
  generateJatakaReading(doc: AIFileInput, metadata: { name: string; dob?: string; tob?: string; birthPlace?: string }): Promise<JatakaStandaloneResult>;
  generatePalmistReading(image: AIFileInput, personLabel: string): Promise<string[]>;
}
