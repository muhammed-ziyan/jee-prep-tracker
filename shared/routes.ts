import { z } from "zod";
import {
  insertUserTopicProgressSchema,
  insertStudySessionSchema,
  insertRevisionScheduleSchema,
  insertBacklogItemSchema,
  insertMockTestSchema,
  insertMockTestSubjectSchema,
} from "./schema";
import type { UserTopicProgress, StudySession, RevisionSchedule, BacklogItem, MockTest, Topic, Subject } from "./types";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  syllabus: {
    list: {
      method: "GET" as const,
      path: "/api/syllabus",
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
    getProgress: {
      method: "GET" as const,
      path: "/api/syllabus/progress",
      responses: {
        200: z.array(z.custom<UserTopicProgress>()),
      },
    },
    updateProgress: {
      method: "POST" as const,
      path: "/api/syllabus/progress",
      input: insertUserTopicProgressSchema
        .pick({ topicId: true, status: true, confidence: true, notes: true })
        .partial({ status: true, confidence: true, notes: true })
        .required({ topicId: true }),
      responses: {
        200: z.custom<UserTopicProgress>(),
        400: errorSchemas.validation,
      },
    },
  },
  dashboard: {
    stats: {
      method: "GET" as const,
      path: "/api/dashboard/stats",
      responses: {
        200: z.object({
          totalStudyHours: z.number(),
          questionsSolved: z.number(),
          syllabusCompletion: z.array(
            z.object({ subjectId: z.number(), subjectName: z.string(), percentage: z.number() })
          ),
          revisionDue: z.number(),
          backlogCount: z.number(),
          examDates: z.array(
            z.object({ id: z.number(), name: z.string(), examDate: z.string(), daysRemaining: z.number() })
          ),
          motivationalQuote: z
            .object({ id: z.number(), quote: z.string(), author: z.string().nullable() })
            .nullable(),
        }),
      },
    },
  },
  studySessions: {
    list: {
      method: "GET" as const,
      path: "/api/study-sessions",
      responses: {
        200: z.array(z.custom<StudySession>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/study-sessions",
      input: insertStudySessionSchema.omit({ userId: true }).partial(),
      responses: {
        201: z.custom<StudySession>(),
        400: errorSchemas.validation,
      },
    },
  },
  revision: {
    list: {
      method: "GET" as const,
      path: "/api/revision",
      responses: {
        200: z.array(z.custom<RevisionSchedule & { topic: Topic }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/revision",
      input: insertRevisionScheduleSchema.omit({ userId: true }).partial(),
      responses: {
        201: z.custom<RevisionSchedule>(),
        400: errorSchemas.validation,
      },
    },
    markComplete: {
      method: "PATCH" as const,
      path: "/api/revision/:id/complete",
      responses: {
        200: z.custom<RevisionSchedule>(),
        404: errorSchemas.notFound,
      },
    },
    createBatch: {
      method: "POST" as const,
      path: "/api/revision/batch",
      input: z.object({
        topicIds: z.array(z.number()).min(1),
        scheduledDate: z.string(),
      }),
      responses: {
        201: z.array(z.custom<RevisionSchedule>()),
        400: errorSchemas.validation,
      },
    },
    deleteSession: {
      method: "DELETE" as const,
      path: "/api/revision/session",
      input: z.object({ scheduledDate: z.string() }),
      responses: {
        200: z.object({ deleted: z.number() }),
        400: errorSchemas.validation,
      },
    },
    completeSession: {
      method: "PATCH" as const,
      path: "/api/revision/session/complete",
      input: z.object({ scheduledDate: z.string() }),
      responses: {
        200: z.object({ completed: z.number() }),
        400: errorSchemas.validation,
      },
    },
  },
  backlog: {
    list: {
      method: "GET" as const,
      path: "/api/backlog",
      responses: {
        200: z.array(z.custom<BacklogItem>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/backlog",
      input: insertBacklogItemSchema.omit({ userId: true }).partial(),
      responses: {
        201: z.custom<BacklogItem>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/backlog/:id",
      input: insertBacklogItemSchema.partial(),
      responses: {
        200: z.custom<BacklogItem>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/backlog/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  mockTests: {
    list: {
      method: "GET" as const,
      path: "/api/mock-tests",
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/mock-tests",
      input: z.object({
        test: insertMockTestSchema.omit({ userId: true }).partial(),
        subjects: z.array(insertMockTestSubjectSchema.omit({ mockTestId: true }).partial()),
      }),
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/mock-tests/:id",
      input: z.object({
        test: insertMockTestSchema.omit({ userId: true }).partial(),
        subjects: z.array(insertMockTestSubjectSchema.omit({ mockTestId: true }).partial()),
      }),
      responses: {
        200: z.custom<any>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
