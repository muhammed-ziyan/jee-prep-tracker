// Plain TypeScript types for app (camelCase for API)

export type Subject = { id: number; name: string; color: string };
export type Unit = { id: number; subjectId: number; name: string; order: number };
export type Topic = { id: number; unitId: number; name: string; order: number; isImportant: boolean | null; weightage: string | null; isClass11: boolean; isClass12: boolean };

export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type Confidence = "low" | "medium" | "high";
export type Priority = "low" | "medium" | "high";
export type BacklogType = "concept" | "practice" | "forgetting";

export type UserTopicProgress = {
  id: number;
  userId: string;
  topicId: number;
  status: ProgressStatus;
  confidence: Confidence | null;
  notes: string | null;
  completedAt: string | null;
  lastRevisedAt: string | null;
};

export type StudySession = {
  id: number;
  userId: string;
  subjectId: number | null;
  durationMinutes: number;
  date: string;
  notes: string | null;
  createdAt: string | null;
};

export type RevisionSchedule = {
  id: number;
  userId: string;
  topicId: number;
  scheduledDate: string;
  status: ProgressStatus;
  completedAt: string | null;
};

export type BacklogItem = {
  id: number;
  userId: string;
  topicId: number | null;
  topicIds: number[] | null;
  title: string;
  description: string | null;
  priority: Priority;
  type: BacklogType;
  deadline: string | null;
  isCompleted: boolean | null;
  createdAt: string | null;
};

export type MockTest = {
  id: string;
  userId: string;
  title: string;
  testDate: string;
  totalScore: number;
  maxScore: number;
  notes: string | null;
};

export type MockTestSubjectScope = "class_11" | "class_12" | "full";

export type MockTestSubject = {
  id: number;
  mockTestId: string;
  subjectId: number;
  score: number;
  negativeMarks: number;
  maxScore: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unattemptedCount: number | null;
  scope: MockTestSubjectScope | null;
  unitIds: number[] | null;
};

export type SubjectWithUnits = Subject & { units: (Unit & { topics: Topic[] })[] };
export type MockTestWithSubjects = MockTest & { subjects: (MockTestSubject & { subject: Subject })[] };
