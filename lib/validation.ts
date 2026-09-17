import { z } from "zod";

export const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().min(1, "Date of birth is required"),
  tob: z.string().max(10).optional().or(z.literal("")),
  birthPlace: z.string().trim().min(2, "Place of birth is required").max(150),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  education: z.string().trim().max(120).optional().or(z.literal("")),
  career: z.string().trim().max(120).optional().or(z.literal("")),
  relationshipGoal: z.string().trim().min(1).max(100).default("Marriage"),
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
  analysisId: z.string().uuid().optional(),
});

export const jatakaReaderSchema = z.object({
  name: z.string().trim().min(1).max(100).default("Individual"),
  dob: z.string().optional(),
  tob: z.string().optional(),
  birthPlace: z.string().optional(),
  documentPath: z.string().min(1, "Please upload a Jataka/Kundli document"),
  consent: z.literal(true),
});
