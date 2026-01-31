// Zod schemas for API validation (no Drizzle)
import { z } from "zod";
export * from "./models/auth";
export * from "./types";

const progressStatusEnum = z.enum(["not_started", "in_progress", "completed"]);
const confidenceEnum = z.enum(["low", "medium", "high"]);
const priorityEnum = z.enum(["low", "medium", "high"]);
const backlogTypeEnum = z.enum(["concept", "practice", "forgetting"]);

export const insertUserTopicProgressSchema = z.object({
  userId: z.string(),
  topicId: z.number(),
  status: progressStatusEnum.default("not_started"),
  confidence: confidenceEnum.optional(),
  notes: z.string().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  lastRevisedAt: z.string().datetime().optional().nullable(),
});

export const insertStudySessionSchema = z.object({
  userId: z.string(),
  subjectId: z.number().optional().nullable(),
  durationMinutes: z.number(),
  date: z.string(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().datetime().optional().nullable(),
});

export const insertRevisionScheduleSchema = z.object({
  userId: z.string(),
  topicId: z.number(),
  scheduledDate: z.string(),
  status: progressStatusEnum.default("not_started"),
  completedAt: z.string().datetime().optional().nullable(),
});

export const insertBacklogItemSchema = z.object({
  userId: z.string(),
  topicId: z.number().optional().nullable(),
  topicIds: z.array(z.number()).optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  priority: priorityEnum.default("medium"),
  type: backlogTypeEnum.default("concept"),
  deadline: z.string().datetime().optional().nullable(),
  isCompleted: z.boolean().optional().nullable(),
  createdAt: z.string().datetime().optional().nullable(),
});

export const insertMockTestSchema = z.object({
  userId: z.string(),
  title: z.string(),
  testDate: z.string(),
  totalScore: z.number(),
  maxScore: z.number(),
  notes: z.string().optional().nullable(),
});

const mockTestSubjectScopeEnum = z.enum(["class_11", "class_12", "full"]);

export const insertMockTestSubjectSchema = z.object({
  mockTestId: z.string().uuid(),
  subjectId: z.number(),
  score: z.number(),
  negativeMarks: z.number().optional().nullable(),
  maxScore: z.number().optional().nullable(),
  correctCount: z.number().optional().nullable(),
  incorrectCount: z.number().optional().nullable(),
  unattemptedCount: z.number().optional().nullable(),
  scope: mockTestSubjectScopeEnum.optional().nullable(),
  unitIds: z.array(z.number()).optional().nullable(),
});
