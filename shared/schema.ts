import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// Enums
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const confidenceEnum = pgEnum("confidence", ["low", "medium", "high"]);
export const progressStatusEnum = pgEnum("progress_status", ["not_started", "in_progress", "completed"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const backlogTypeEnum = pgEnum("backlog_type", ["concept", "practice", "forgetting"]);

// Subjects and Syllabus Structure
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Physics, Chemistry, Maths
  color: text("color").notNull(), // Hex code for UI
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").references(() => units.id).notNull(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  isImportant: boolean("is_important").default(false),
  weightage: text("weightage"), // e.g. "High", "Low", or specific marks range
});

// User Progress
export const userTopicProgress = pgTable("user_topic_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => topics.id).notNull(),
  status: progressStatusEnum("status").default("not_started").notNull(),
  confidence: confidenceEnum("confidence"),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  lastRevisedAt: timestamp("last_revised_at"),
});

// Study Sessions
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id), // Optional, can be general study
  durationMinutes: integer("duration_minutes").notNull(),
  date: date("date", { mode: "string" }).notNull(), // YYYY-MM-DD
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Revision Schedule
export const revisionSchedules = pgTable("revision_schedules", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => topics.id).notNull(),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  status: progressStatusEnum("status").default("not_started").notNull(),
  completedAt: timestamp("completed_at"),
});

// Backlog & Weak Topics
export const backlogItems = pgTable("backlog_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => topics.id), // Can be linked to a syllabus topic or custom
  title: text("title").notNull(),
  description: text("description"),
  priority: priorityEnum("priority").default("medium").notNull(),
  type: backlogTypeEnum("type").default("concept").notNull(),
  deadline: timestamp("deadline"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mock Tests
export const mockTests = pgTable("mock_tests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  totalScore: integer("total_score").notNull(),
  maxScore: integer("max_score").notNull(),
  notes: text("notes"),
});

export const mockTestSubjects = pgTable("mock_test_subjects", {
  id: serial("id").primaryKey(),
  mockTestId: integer("mock_test_id").references(() => mockTests.id, { onDelete: 'cascade' }).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  score: integer("score").notNull(),
  correctCount: integer("correct_count").default(0),
  incorrectCount: integer("incorrect_count").default(0),
  unattemptedCount: integer("unattempted_count").default(0),
});

// Schemas
export const insertSubjectSchema = createInsertSchema(subjects);
export const insertUnitSchema = createInsertSchema(units);
export const insertTopicSchema = createInsertSchema(topics);
export const insertUserTopicProgressSchema = createInsertSchema(userTopicProgress);
export const insertStudySessionSchema = createInsertSchema(studySessions);
export const insertRevisionScheduleSchema = createInsertSchema(revisionSchedules);
export const insertBacklogItemSchema = createInsertSchema(backlogItems);
export const insertMockTestSchema = createInsertSchema(mockTests);
export const insertMockTestSubjectSchema = createInsertSchema(mockTestSubjects);

// Types
export type Subject = typeof subjects.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type UserTopicProgress = typeof userTopicProgress.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type RevisionSchedule = typeof revisionSchedules.$inferSelect;
export type BacklogItem = typeof backlogItems.$inferSelect;
export type MockTest = typeof mockTests.$inferSelect;
export type MockTestSubject = typeof mockTestSubjects.$inferSelect;

// Frontend Types
export type SubjectWithUnits = Subject & { units: (Unit & { topics: Topic[] })[] };
export type MockTestWithSubjects = MockTest & { subjects: (MockTestSubject & { subject: Subject })[] };
