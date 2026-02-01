import { createClient } from "@/lib/supabase/server";
import { JEE_MAIN_SYLLABUS } from "lib/jee-syllabus-data";
import type {
  Subject,
  Unit,
  Topic,
  UserTopicProgress,
  StudySession,
  RevisionSchedule,
  BacklogItem,
  MockTest,
  MockTestSubject,
} from "@shared/types";

// Map snake_case from Supabase to camelCase for API
function toCamel<T extends Record<string, unknown>>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out as T;
}
function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
}

export type SyllabusScope = "class_11" | "class_12" | "whole";

export async function getSubjectsWithUnitsAndTopics(
  scope?: SyllabusScope
): Promise<(Subject & { units: (Unit & { topics: Topic[] })[] })[]> {
  const supabase = await createClient();
  const { data: subjectsData, error: subErr } = await supabase.from("subjects").select("*").order("id");
  if (subErr) throw subErr;
  const result: (Subject & { units: (Unit & { topics: Topic[] })[] })[] = [];
  for (const s of subjectsData || []) {
    const subject = toCamel<Subject>(s);
    const { data: unitsData, error: uErr } = await supabase
      .from("units")
      .select("*")
      .eq("subject_id", s.id)
      .order("order");
    if (uErr) throw uErr;
    const unitsWithTopics: (Unit & { topics: Topic[] })[] = [];
    for (const u of unitsData || []) {
      const unit = toCamel<Unit>(u);
      let topicsQuery = supabase.from("topics").select("*").eq("unit_id", u.id).order("order");
      if (scope === "class_11") topicsQuery = topicsQuery.eq("is_class_11", true);
      else if (scope === "class_12") topicsQuery = topicsQuery.eq("is_class_12", true);
      const { data: topicsData, error: tErr } = await topicsQuery;
      if (tErr) throw tErr;
      const topics = (topicsData || []).map((t) => toCamel<Topic>(t));
      // When filtering by class: only include units that have at least one topic in that scope
      if (scope === "class_11" || scope === "class_12") {
        if (topics.length === 0) continue;
      }
      unitsWithTopics.push({ ...unit, topics });
    }
    // When filtering by class: only include subjects that have at least one unit in that scope
    if (scope === "class_11" || scope === "class_12") {
      if (unitsWithTopics.length === 0) continue;
    }
    result.push({ ...subject, units: unitsWithTopics });
  }
  return result;
}

export async function getTopicProgress(userId: string): Promise<UserTopicProgress[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_topic_progress").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => toCamel<UserTopicProgress>(r));
}

export async function updateTopicProgress(
  progress: Partial<UserTopicProgress> & { userId: string; topicId: number }
): Promise<UserTopicProgress> {
  const supabase = await createClient();
  const row = toSnake({ ...progress, userId: progress.userId, topicId: progress.topicId });
  const { data, error } = await supabase
    .from("user_topic_progress")
    .upsert(row, { onConflict: "user_id,topic_id", ignoreDuplicates: false })
    .select()
    .single();
  if (error) throw error;
  return toCamel<UserTopicProgress>(data);
}

export type ExamDateForDashboard = { id: number; name: string; examDate: string; daysRemaining: number };

export type MotivationalQuoteForDashboard = { id: number; quote: string; author: string | null };

export async function getActiveMotivationalQuotes(): Promise<MotivationalQuoteForDashboard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("motivational_quotes")
    .select("id, quote, author")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    quote: r.quote,
    author: r.author ?? null,
  }));
}

export async function getExamDates(): Promise<ExamDateForDashboard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_dates")
    .select("id, name, exam_date")
    .order("display_order", { ascending: true })
    .order("exam_date", { ascending: true });
  if (error) throw error;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (data || []).map((r) => {
    const examDate = (r.exam_date as string).slice(0, 10);
    const d = new Date(examDate);
    d.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { id: r.id, name: r.name, examDate, daysRemaining };
  });
}

export async function getDashboardStats(userId: string): Promise<{
  totalStudyHours: number;
  questionsSolved: number;
  syllabusCompletion: { subjectId: number; subjectName: string; percentage: number }[];
  revisionDue: number;
  backlogCount: number;
  examDates: ExamDateForDashboard[];
  motivationalQuote: MotivationalQuoteForDashboard | null;
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [sessionsRes, subjectsRes, revisionRes, backlogRes, examDates, activeQuotes] = await Promise.all([
    supabase.from("study_sessions").select("duration_minutes").eq("user_id", userId),
    supabase.from("subjects").select("id, name"),
    supabase.from("revision_schedules").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "not_started").lte("scheduled_date", today),
    supabase.from("backlog_items").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_completed", false),
    getExamDates(),
    getActiveMotivationalQuotes(),
  ]);
  const motivationalQuote =
    activeQuotes.length > 0 ? activeQuotes[Math.floor(Math.random() * activeQuotes.length)]! : null;
  const totalMinutes = (sessionsRes.data || []).reduce((s, r) => s + (r.duration_minutes || 0), 0);
  const syllabusCompletion: { subjectId: number; subjectName: string; percentage: number }[] = [];
  for (const sub of subjectsRes.data || []) {
    const { data: unitRows } = await supabase.from("units").select("id").eq("subject_id", sub.id);
    const unitIds = (unitRows || []).map((u) => u.id);
    const { count: total } = await supabase.from("topics").select("id", { count: "exact", head: true }).in("unit_id", unitIds);
    const { data: topicRows } = await supabase.from("topics").select("id").in("unit_id", unitIds);
    const topicIds = (topicRows || []).map((t) => t.id);
    const { count: completed } = await supabase.from("user_topic_progress").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").in("topic_id", topicIds);
    const totalN = total ?? 0;
    const completedN = completed ?? 0;
    syllabusCompletion.push({
      subjectId: sub.id,
      subjectName: sub.name,
      percentage: totalN > 0 ? Math.round((completedN / totalN) * 100) : 0,
    });
  }
  return {
    totalStudyHours: Math.round(totalMinutes / 60),
    questionsSolved: 0,
    syllabusCompletion,
    revisionDue: revisionRes.count ?? 0,
    backlogCount: backlogRes.count ?? 0,
    examDates: examDates ?? [],
    motivationalQuote,
  };
}

export async function getStudySessions(userId: string): Promise<StudySession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("study_sessions").select("*").eq("user_id", userId).order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => toCamel<StudySession>(r));
}

export async function createStudySession(session: Partial<StudySession> & { userId: string }): Promise<StudySession> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("study_sessions").insert(toSnake(session)).select().single();
  if (error) throw error;
  return toCamel<StudySession>(data);
}

export async function getRevisionSchedule(userId: string): Promise<(RevisionSchedule & { topic: Topic })[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase.from("revision_schedules").select("*, topics(*)").eq("user_id", userId).order("scheduled_date");
  if (error) throw error;
  return (rows || []).map((r) => {
    const { topics: t, ...rest } = r as { topics: Record<string, unknown>; [k: string]: unknown };
    return { ...toCamel<RevisionSchedule>(rest), topic: toCamel<Topic>(t || {}) };
  });
}

export async function createRevisionSchedule(schedule: Partial<RevisionSchedule> & { userId: string }): Promise<RevisionSchedule> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("revision_schedules").insert(toSnake(schedule)).select().single();
  if (error) throw error;
  return toCamel<RevisionSchedule>(data);
}

export async function completeRevision(id: number): Promise<RevisionSchedule | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revision_schedules")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return undefined;
  return toCamel<RevisionSchedule>(data);
}

export async function getBacklogItems(userId: string): Promise<BacklogItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("backlog_items").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => toCamel<BacklogItem>(r));
}

export async function createBacklogItem(item: Partial<BacklogItem> & { userId: string }): Promise<BacklogItem> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("backlog_items").insert(toSnake(item)).select().single();
  if (error) throw error;
  return toCamel<BacklogItem>(data);
}

export async function updateBacklogItem(id: number, updates: Partial<BacklogItem>): Promise<BacklogItem | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("backlog_items").update(toSnake(updates)).eq("id", id).select().single();
  if (error || !data) return undefined;
  return toCamel<BacklogItem>(data);
}

export async function deleteBacklogItem(id: number): Promise<void> {
  const supabase = await createClient();
  await supabase.from("backlog_items").delete().eq("id", id);
}

export async function getMockTests(userId: string): Promise<(MockTest & { subjects: (MockTestSubject & { subject: Subject })[] })[]> {
  const supabase = await createClient();
  const { data: tests, error: te } = await supabase.from("mock_tests").select("*").eq("user_id", userId).order("test_date", { ascending: false });
  if (te) throw te;
  const result: (MockTest & { subjects: (MockTestSubject & { subject: Subject })[] })[] = [];
  for (const test of tests || []) {
    const { data: subjData, error: se } = await supabase.from("mock_test_subjects").select("*, subjects(*)").eq("mock_test_id", test.id);
    if (se) throw se;
    const subjects = (subjData || []).map((s) => {
      const { subjects: subRow, ...rest } = s as { subjects: Record<string, unknown> | null; [k: string]: unknown };
      return { ...toCamel<MockTestSubject>(rest), subject: toCamel<Subject>(subRow || {}) };
    });
    result.push({ ...toCamel<MockTest>(test), subjects: subjects as (MockTestSubject & { subject: Subject })[] });
  }
  return result;
}

export async function createMockTest(test: Partial<MockTest> & { userId: string }, subjectsData: Partial<MockTestSubject>[]): Promise<MockTest> {
  const supabase = await createClient();
  const { data: newTest, error: e1 } = await supabase.from("mock_tests").insert(toSnake(test)).select().single();
  if (e1) throw e1;
  if (subjectsData?.length) {
    const rows = subjectsData.map((s) => ({ ...toSnake(s), mock_test_id: (newTest as { id: string }).id }));
    await supabase.from("mock_test_subjects").insert(rows);
  }
  return toCamel<MockTest>(newTest);
}

export async function updateMockTest(
  testId: string,
  test: Partial<MockTest>,
  subjectsData: Partial<MockTestSubject>[]
): Promise<MockTest> {
  const supabase = await createClient();
  const { data: updated, error: e1 } = await supabase
    .from("mock_tests")
    .update(toSnake(test))
    .eq("id", testId)
    .select()
    .single();
  if (e1) throw e1;
  await supabase.from("mock_test_subjects").delete().eq("mock_test_id", testId);
  if (subjectsData?.length) {
    const rows = subjectsData.map((s) => ({ ...toSnake(s), mock_test_id: testId }));
    await supabase.from("mock_test_subjects").insert(rows);
  }
  return toCamel<MockTest>(updated);
}

export async function seedSyllabus(): Promise<void> {
  const supabase = await createClient();
  const { data: existingSubjects } = await supabase.from("subjects").select("id, name");

  if (!existingSubjects?.length) {
    for (const subjectSeed of JEE_MAIN_SYLLABUS) {
      const { data: subRows } = await supabase
        .from("subjects")
        .insert({ name: subjectSeed.name, color: subjectSeed.color })
        .select("id")
        .single();
      if (!subRows?.id) continue;
      await insertUnitsAndTopics(supabase, subRows.id as number, subjectSeed.units);
    }
    return;
  }

  for (const subjectSeed of JEE_MAIN_SYLLABUS) {
    const subject = existingSubjects.find((s) => s.name === subjectSeed.name);
    if (!subject) continue;
    const { count } = await supabase.from("units").select("id", { count: "exact", head: true }).eq("subject_id", subject.id);
    if ((count ?? 0) > 0) continue;
    await insertUnitsAndTopics(supabase, subject.id as number, subjectSeed.units);
  }
}

async function insertUnitsAndTopics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subjectId: number,
  units: {
    name: string;
    order: number;
    topics: { name: string; order: number; isImportant: boolean; isClass11: boolean; isClass12: boolean }[];
  }[]
): Promise<void> {
  for (const unitSeed of units) {
    const { data: unitRows } = await supabase
      .from("units")
      .insert({ subject_id: subjectId, name: unitSeed.name, order: unitSeed.order })
      .select("id")
      .single();
    if (!unitRows?.id) continue;
    const topicRows: {
      unit_id: number;
      name: string;
      order: number;
      is_important: boolean;
      is_class_11: boolean;
      is_class_12: boolean;
    }[] = [];
    for (const t of unitSeed.topics) {
      topicRows.push({
        unit_id: unitRows.id,
        name: t.name,
        order: t.order,
        is_important: t.isImportant,
        is_class_11: t.isClass11,
        is_class_12: t.isClass12,
      });
    }
    if (topicRows.length) await supabase.from("topics").insert(topicRows);
  }
}
