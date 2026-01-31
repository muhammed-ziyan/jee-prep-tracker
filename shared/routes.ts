import { z } from 'zod';
import { 
  insertUserTopicProgressSchema, 
  insertStudySessionSchema, 
  insertRevisionScheduleSchema, 
  insertBacklogItemSchema, 
  insertMockTestSchema, 
  insertMockTestSubjectSchema,
  subjects,
  units,
  topics,
  userTopicProgress,
  studySessions,
  revisionSchedules,
  backlogItems,
  mockTests,
  mockTestSubjects
} from './schema';

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
      method: 'GET' as const,
      path: '/api/syllabus',
      responses: {
        200: z.array(z.custom<any>()), // SubjectWithUnits type, hard to express in Zod perfectly without recursion
      },
    },
    getProgress: {
      method: 'GET' as const,
      path: '/api/syllabus/progress',
      responses: {
        200: z.array(z.custom<typeof userTopicProgress.$inferSelect>()),
      },
    },
    updateProgress: {
      method: 'POST' as const,
      path: '/api/syllabus/progress',
      input: insertUserTopicProgressSchema.pick({ topicId: true, status: true, confidence: true, notes: true }).partial({ status: true, confidence: true, notes: true }).required({ topicId: true }),
      responses: {
        200: z.custom<typeof userTopicProgress.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalStudyHours: z.number(),
          questionsSolved: z.number(), // Placeholder as we don't have a questions table, maybe derived from mock tests?
          syllabusCompletion: z.array(z.object({ subjectId: z.number(), subjectName: z.string(), percentage: z.number() })),
          revisionDue: z.number(),
          backlogCount: z.number(),
        }),
      },
    },
  },
  studySessions: {
    list: {
      method: 'GET' as const,
      path: '/api/study-sessions',
      responses: {
        200: z.array(z.custom<typeof studySessions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/study-sessions',
      input: insertStudySessionSchema.omit({ userId: true, id: true, createdAt: true }),
      responses: {
        201: z.custom<typeof studySessions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  revision: {
    list: {
      method: 'GET' as const,
      path: '/api/revision',
      responses: {
        200: z.array(z.custom<typeof revisionSchedules.$inferSelect & { topic: typeof topics.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/revision',
      input: insertRevisionScheduleSchema.omit({ userId: true, id: true, completedAt: true }),
      responses: {
        201: z.custom<typeof revisionSchedules.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    markComplete: {
      method: 'PATCH' as const,
      path: '/api/revision/:id/complete',
      responses: {
        200: z.custom<typeof revisionSchedules.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  backlog: {
    list: {
      method: 'GET' as const,
      path: '/api/backlog',
      responses: {
        200: z.array(z.custom<typeof backlogItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/backlog',
      input: insertBacklogItemSchema.omit({ userId: true, id: true, createdAt: true, isCompleted: true }),
      responses: {
        201: z.custom<typeof backlogItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/backlog/:id',
      input: insertBacklogItemSchema.partial(),
      responses: {
        200: z.custom<typeof backlogItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/backlog/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  mockTests: {
    list: {
      method: 'GET' as const,
      path: '/api/mock-tests',
      responses: {
        200: z.array(z.custom<any>()), // MockTestWithSubjects
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/mock-tests',
      input: z.object({
        test: insertMockTestSchema.omit({ userId: true, id: true }),
        subjects: z.array(insertMockTestSubjectSchema.omit({ id: true, mockTestId: true })),
      }),
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
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
