import { z } from "zod";

export const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  gender: z.enum(["male", "female", "other"]).default("male"),
  dob: z.string().optional().default("1998-01-01").transform((v) => v || "1998-01-01"),
  tob: z.string().max(10).optional().or(z.literal("")),
  birthPlace: z.string().trim().max(150).optional().default("Delhi, India").transform((v) => v || "Delhi, India"),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  education: z.string().trim().max(120).optional().or(z.literal("")),
  career: z.string().trim().max(120).optional().or(z.literal("")),
  relationshipGoal: z.string().trim().max(100).default("Marriage").transform((v) => v || "Marriage"),
  careerGoal: z.string().trim().max(100).optional().or(z.literal("")),
  lifestyle: z.array(z.string().max(60)).max(15).default([]),
  values: z.array(z.string().max(60)).max(15).default([]),
  interests: z.array(z.string().max(60)).max(15).optional().default([]),
  profilePhotoPath: z.string().optional().or(z.literal("")),
  handPhotoPath: z.string().optional().or(z.literal("")),
  jatakaPath: z.string().optional().or(z.literal("")),
});

export const analysisSchema = z.object({
  personA: personSchema,
  personB: personSchema,
  modules: z
    .array(z.enum(["compatibility", "jataka", "numerology", "palm", "career", "relationship"]))
    .min(1, "Please select at least one reading focus"),
  consent: z.literal(true),
  analysisId: z.string().uuid().optional().or(z.literal("")),
});

export const jatakaReaderSchema = z.object({
  name: z.string().trim().min(1).max(100).default("Individual"),
  dob: z.string().optional(),
  tob: z.string().optional(),
  birthPlace: z.string().optional(),
  documentPath: z.string().min(1, "Please upload a Jataka/Kundli document"),
  consent: z.literal(true),
});
