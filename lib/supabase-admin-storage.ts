/**
 * Admin-only storage using Supabase service role client.
 * Call only after verifying the request is from an admin (getAdminUser()).
 */
import { createAdminClient } from "@/lib/supabase/admin";
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

// --- Syllabus CRUD (admin only) ---

export async function adminGetSubjectsWithUnitsAndTopics(): Promise<
  (Subject & { units: (Unit & { topics: Topic[] })[] })[]
> {
  const supabase = createAdminClient();
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
      const { data: topicsData, error: tErr } = await supabase
        .from("topics")
        .select("*")
        .eq("unit_id", u.id)
        .order("order");
      if (tErr) throw tErr;
      const topics = (topicsData || []).map((t) => toCamel<Topic>(t));
      unitsWithTopics.push({ ...unit, topics });
    }
    result.push({ ...subject, units: unitsWithTopics });
  }
  return result;
}

export async function adminCreateSubject(data: { name: string; color: string }): Promise<Subject> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("subjects")
    .insert({ name: data.name, color: data.color })
    .select()
    .single();
  if (error) throw error;
  return toCamel<Subject>(row);
}

export async function adminUpdateSubject(id: number, data: Partial<{ name: string; color: string }>): Promise<Subject> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("subjects")
    .update(toSnake(data as Record<string, unknown>))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamel<Subject>(row);
}

export async function adminDeleteSubject(id: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("subjects").delete().eq("id", id);
}

export async function adminCreateUnit(subjectId: number, data: { name: string; order: number }): Promise<Unit> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("units")
    .insert({ subject_id: subjectId, name: data.name, order: data.order })
    .select()
    .single();
  if (error) throw error;
  return toCamel<Unit>(row);
}

export async function adminUpdateUnit(id: number, data: Partial<{ name: string; order: number }>): Promise<Unit> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("units")
    .update(toSnake(data as Record<string, unknown>))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamel<Unit>(row);
}

export async function adminDeleteUnit(id: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("units").delete().eq("id", id);
}

export async function adminCreateTopic(
  unitId: number,
  data: Partial<{ name: string; order: number; isImportant: boolean; weightage: string; isClass11: boolean; isClass12: boolean }> & { name: string; order: number }
): Promise<Topic> {
  const supabase = createAdminClient();
  const row = {
    unit_id: unitId,
    name: data.name,
    order: data.order,
    is_important: data.isImportant ?? false,
    weightage: data.weightage ?? null,
    is_class_11: data.isClass11 ?? true,
    is_class_12: data.isClass12 ?? true,
  };
  const { data: out, error } = await supabase.from("topics").insert(row).select().single();
  if (error) throw error;
  return toCamel<Topic>(out);
}

export async function adminUpdateTopic(
  id: number,
  data: Partial<{ name: string; order: number; isImportant: boolean; weightage: string | null; isClass11: boolean; isClass12: boolean }>
): Promise<Topic> {
  const supabase = createAdminClient();
  const payload = toSnake(data as Record<string, unknown>);
  const { data: row, error } = await supabase.from("topics").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return toCamel<Topic>(row);
}

export async function adminDeleteTopic(id: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("topics").delete().eq("id", id);
}

// --- User data by userId (admin acting on behalf of user) ---

export async function adminGetTopicProgress(userId: string): Promise<UserTopicProgress[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("user_topic_progress").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => toCamel<UserTopicProgress>(r));
}

export async function adminUpdateTopicProgress(
  userId: string,
  progress: Partial<UserTopicProgress> & { topicId: number }
): Promise<UserTopicProgress> {
  const supabase = createAdminClient();
  const row = toSnake({ ...progress, userId, topicId: progress.topicId });
  const { data, error } = await supabase
    .from("user_topic_progress")
    .upsert(row, { onConflict: "user_id,topic_id", ignoreDuplicates: false })
    .select()
    .single();
  if (error) throw error;
  return toCamel<UserTopicProgress>(data);
}

export async function adminGetStudySessions(userId: string): Promise<StudySession[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => toCamel<StudySession>(r));
}

export async function adminCreateStudySession(
  userId: string,
  session: Partial<StudySession>
): Promise<StudySession> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("study_sessions")
    .insert(toSnake({ ...session, userId }))
    .select()
    .single();
  if (error) throw error;
  return toCamel<StudySession>(data);
}

export async function adminUpdateStudySession(
  sessionId: number,
  updates: Partial<Pick<StudySession, "durationMinutes" | "date" | "notes" | "subjectId">>
): Promise<StudySession> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("study_sessions")
    .update(toSnake(updates))
    .eq("id", sessionId)
    .select()
    .single();
  if (error) throw error;
  return toCamel<StudySession>(data);
}

export async function adminDeleteStudySession(sessionId: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("study_sessions").delete().eq("id", sessionId);
}

export async function adminGetRevisionSchedule(
  userId: string
): Promise<(RevisionSchedule & { topic: Topic })[]> {
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("revision_schedules")
    .select("*, topics(*)")
    .eq("user_id", userId)
    .order("scheduled_date");
  if (error) throw error;
  return (rows || []).map((r) => {
    const { topics: t, ...rest } = r as { topics: Record<string, unknown>; [k: string]: unknown };
    return { ...toCamel<RevisionSchedule>(rest), topic: toCamel<Topic>(t || {}) };
  });
}

export async function adminCreateRevisionSchedule(
  userId: string,
  schedule: Partial<RevisionSchedule>
): Promise<RevisionSchedule> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("revision_schedules")
    .insert(toSnake({ ...schedule, userId }))
    .select()
    .single();
  if (error) throw error;
  return toCamel<RevisionSchedule>(data);
}

export async function adminUpdateRevisionSchedule(
  scheduleId: number,
  updates: Partial<Pick<RevisionSchedule, "scheduledDate" | "status" | "completedAt">>
): Promise<RevisionSchedule> {
  const supabase = createAdminClient();
  const payload = toSnake(updates as Record<string, unknown>);
  if ("completedAt" in updates && updates.completedAt) payload.completed_at = updates.completedAt;
  const { data, error } = await supabase
    .from("revision_schedules")
    .update(payload)
    .eq("id", scheduleId)
    .select()
    .single();
  if (error) throw error;
  return toCamel<RevisionSchedule>(data);
}

export async function adminDeleteRevisionSchedule(scheduleId: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("revision_schedules").delete().eq("id", scheduleId);
}

export async function adminCompleteRevision(scheduleId: number): Promise<RevisionSchedule | undefined> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("revision_schedules")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", scheduleId)
    .select()
    .single();
  if (error || !data) return undefined;
  return toCamel<RevisionSchedule>(data);
}

export async function adminGetBacklogItems(userId: string): Promise<BacklogItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("backlog_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => toCamel<BacklogItem>(r));
}

export async function adminCreateBacklogItem(
  userId: string,
  item: Partial<BacklogItem>
): Promise<BacklogItem> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("backlog_items")
    .insert(toSnake({ ...item, userId }))
    .select()
    .single();
  if (error) throw error;
  return toCamel<BacklogItem>(data);
}

export async function adminUpdateBacklogItem(
  itemId: number,
  updates: Partial<BacklogItem>
): Promise<BacklogItem | undefined> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("backlog_items")
    .update(toSnake(updates))
    .eq("id", itemId)
    .select()
    .single();
  if (error || !data) return undefined;
  return toCamel<BacklogItem>(data);
}

export async function adminDeleteBacklogItem(itemId: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("backlog_items").delete().eq("id", itemId);
}

export async function adminGetMockTests(
  userId: string
): Promise<(MockTest & { subjects: (MockTestSubject & { subject: Subject })[] })[]> {
  const supabase = createAdminClient();
  const { data: tests, error: te } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("user_id", userId)
    .order("test_date", { ascending: false });
  if (te) throw te;
  const result: (MockTest & { subjects: (MockTestSubject & { subject: Subject })[] })[] = [];
  for (const test of tests || []) {
    const { data: subjData, error: se } = await supabase
      .from("mock_test_subjects")
      .select("*, subjects(*)")
      .eq("mock_test_id", test.id);
    if (se) throw se;
    const subjects = (subjData || []).map((s) => {
      const { subjects: subRow, ...rest } = s as { subjects: Record<string, unknown> | null; [k: string]: unknown };
      return { ...toCamel<MockTestSubject>(rest), subject: toCamel<Subject>(subRow || {}) };
    });
    result.push({
      ...toCamel<MockTest>(test),
      subjects: subjects as (MockTestSubject & { subject: Subject })[],
    });
  }
  return result;
}

export async function adminCreateMockTest(
  userId: string,
  test: Partial<MockTest>,
  subjectsData: Partial<MockTestSubject>[]
): Promise<MockTest> {
  const supabase = createAdminClient();
  const { data: newTest, error: e1 } = await supabase
    .from("mock_tests")
    .insert(toSnake({ ...test, userId }))
    .select()
    .single();
  if (e1) throw e1;
  if (subjectsData?.length) {
    const rows = subjectsData.map((s) => ({
      ...toSnake(s),
      mock_test_id: (newTest as { id: string }).id,
    }));
    await supabase.from("mock_test_subjects").insert(rows);
  }
  return toCamel<MockTest>(newTest);
}

export async function adminUpdateMockTest(
  testId: string,
  userId: string,
  test: Partial<MockTest>,
  subjectsData: Partial<MockTestSubject>[]
): Promise<MockTest> {
  const supabase = createAdminClient();
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

export async function adminDeleteMockTest(testId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("mock_tests").delete().eq("id", testId);
}

// --- Analytics (admin only, cross-user) ---

export async function adminGetAnalytics(params: { from?: string; to?: string }): Promise<{
  totalStudyHours: number;
  activeUsersCount: number;
  totalSessionsCount: number;
}> {
  const supabase = createAdminClient();
  let sessionsQuery = supabase.from("study_sessions").select("user_id, duration_minutes, date");
  if (params.from) sessionsQuery = sessionsQuery.gte("date", params.from);
  if (params.to) sessionsQuery = sessionsQuery.lte("date", params.to);
  const { data: sessions, error } = await sessionsQuery;
  if (error) throw error;
  const rows = sessions ?? [];
  const totalMinutes = rows.reduce((s, r) => s + (r.duration_minutes || 0), 0);
  const uniqueUsers = new Set(rows.map((r) => r.user_id));
  return {
    totalStudyHours: Math.round(totalMinutes / 60),
    activeUsersCount: uniqueUsers.size,
    totalSessionsCount: rows.length,
  };
}

export async function adminGetStudentStats(
  userId: string,
  params: { from?: string; to?: string }
): Promise<{
  totalStudyHours: number;
  sessionsCount: number;
  syllabusCompletionPct: number;
  revisionDue: number;
  backlogCount: number;
}> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  let sessionsQuery = supabase.from("study_sessions").select("duration_minutes, date").eq("user_id", userId);
  if (params.from) sessionsQuery = sessionsQuery.gte("date", params.from);
  if (params.to) sessionsQuery = sessionsQuery.lte("date", params.to);
  const { data: sessionsData } = await sessionsQuery;
  const totalMinutes = (sessionsData ?? []).reduce((s, r) => s + (r.duration_minutes || 0), 0);
  const sessionsCount = (sessionsData ?? []).length;
  const { data: subjectsData } = await supabase.from("subjects").select("id, name");
  let totalTopics = 0;
  let completedTopics = 0;
  for (const sub of subjectsData ?? []) {
    const { data: unitRows } = await supabase.from("units").select("id").eq("subject_id", sub.id);
    const unitIds = (unitRows ?? []).map((u) => u.id);
    const { count: total } = await supabase.from("topics").select("id", { count: "exact", head: true }).in("unit_id", unitIds);
    const { data: topicRows } = await supabase.from("topics").select("id").in("unit_id", unitIds);
    const topicIds = (topicRows ?? []).map((t) => t.id);
    const { count: completed } = await supabase.from("user_topic_progress").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").in("topic_id", topicIds);
    totalTopics += total ?? 0;
    completedTopics += completed ?? 0;
  }
  const syllabusCompletionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const { count: revisionDue } = await supabase.from("revision_schedules").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "not_started").lte("scheduled_date", today);
  const { count: backlogCount } = await supabase.from("backlog_items").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_completed", false);
  return {
    totalStudyHours: Math.round(totalMinutes / 60),
    sessionsCount,
    syllabusCompletionPct,
    revisionDue: revisionDue ?? 0,
    backlogCount: backlogCount ?? 0,
  };
}

export async function adminGetStudySessionsReport(params: {
  from: string;
  to: string;
  userId?: string;
}): Promise<{ sessions: (StudySession & { userEmail?: string })[]; userEmails: Record<string, string> }> {
  const supabase = createAdminClient();
  let query = supabase.from("study_sessions").select("*").gte("date", params.from).lte("date", params.to).order("date", { ascending: false });
  if (params.userId) query = query.eq("user_id", params.userId);
  const { data: rows, error } = await query;
  if (error) throw error;
  const sessions = (rows ?? []).map((r) => toCamel<StudySession>(r));
  const userIds = [...new Set(sessions.map((s) => s.userId))];
  const userEmails: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    for (const u of authUsers?.users ?? []) {
      if (u.id && u.email) userEmails[u.id] = u.email;
    }
  }
  const sessionsWithEmail = sessions.map((s) => ({ ...s, userEmail: userEmails[s.userId] ?? s.userId }));
  return { sessions: sessionsWithEmail, userEmails };
}

export async function adminGetAnalyticsStudents(params: {
  from?: string;
  to?: string;
}): Promise<
  { userId: string; email: string | null; totalStudyHours: number; sessionsCount: number; syllabusCompletionPct: number; revisionDue: number; backlogCount: number }[]
> {
  const supabase = createAdminClient();
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const users = authData?.users ?? [];
  const result: { userId: string; email: string | null; totalStudyHours: number; sessionsCount: number; syllabusCompletionPct: number; revisionDue: number; backlogCount: number }[] = [];
  for (const u of users) {
    const stats = await adminGetStudentStats(u.id, params);
    result.push({
      userId: u.id,
      email: u.email ?? null,
      totalStudyHours: stats.totalStudyHours,
      sessionsCount: stats.sessionsCount,
      syllabusCompletionPct: stats.syllabusCompletionPct,
      revisionDue: stats.revisionDue,
      backlogCount: stats.backlogCount,
    });
  }
  return result;
}

export async function adminGetSyllabusOverview(): Promise<{
  subjects: Array<{
    id: number;
    name: string;
    color: string;
    units: Array<{
      id: number;
      name: string;
      totalTopics: number;
      completedTopics: number;
      completionPercentage: number;
      students: Array<{
        userId: string;
        email: string | null;
        completedTopics: number;
        completionPercentage: number;
      }>;
    }>;
  }>;
}> {
  const supabase = createAdminClient();
  
  // Get all users
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const users = authData?.users ?? [];
  const userMap = new Map<string, string | null>();
  for (const u of users) {
    userMap.set(u.id, u.email ?? null);
  }

  // Get all subjects with units and topics
  const syllabus = await adminGetSubjectsWithUnitsAndTopics();
  
  // Get all progress data
  const { data: allProgress, error: progressErr } = await supabase
    .from("user_topic_progress")
    .select("user_id, topic_id, status");
  if (progressErr) throw progressErr;
  
  // Build a map of topicId -> userId -> status
  const progressMap = new Map<number, Map<string, string>>();
  for (const p of allProgress ?? []) {
    const topicId = p.topic_id as number;
    const userId = p.user_id as string;
    const status = p.status as string;
    if (!progressMap.has(topicId)) {
      progressMap.set(topicId, new Map());
    }
    progressMap.get(topicId)!.set(userId, status);
  }

  const result: {
    subjects: Array<{
      id: number;
      name: string;
      color: string;
      units: Array<{
        id: number;
        name: string;
        totalTopics: number;
        completedTopics: number;
        completionPercentage: number;
        students: Array<{
          userId: string;
          email: string | null;
          completedTopics: number;
          completionPercentage: number;
        }>;
      }>;
    }>;
  } = {
    subjects: [],
  };

  for (const subject of syllabus) {
    const subjectUnits: Array<{
      id: number;
      name: string;
      totalTopics: number;
      completedTopics: number;
      completionPercentage: number;
      students: Array<{
        userId: string;
        email: string | null;
        completedTopics: number;
        completionPercentage: number;
      }>;
    }> = [];

    for (const unit of subject.units) {
      const totalTopics = unit.topics.length;
      
      // Calculate per-student completion
      const studentStats = new Map<string, { completed: number; total: number }>();
      
      // Initialize all students with 0 completed, totalTopics total
      for (const userId of userMap.keys()) {
        studentStats.set(userId, { completed: 0, total: totalTopics });
      }
      
      // Process each topic's progress
      for (const topic of unit.topics) {
        const topicProgress = progressMap.get(topic.id);
        if (topicProgress) {
          for (const [userId, status] of topicProgress.entries()) {
            if (!studentStats.has(userId)) {
              studentStats.set(userId, { completed: 0, total: totalTopics });
            }
            const stats = studentStats.get(userId)!;
            if (status === "completed") {
              stats.completed++;
            }
          }
        }
      }

      // Calculate aggregated stats
      let totalCompletedAcrossAllStudents = 0;
      for (const stats of studentStats.values()) {
        totalCompletedAcrossAllStudents += stats.completed;
      }

      const students = Array.from(studentStats.entries()).map(([userId, stats]) => ({
        userId,
        email: userMap.get(userId) ?? null,
        completedTopics: stats.completed,
        completionPercentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }));

      const totalPossibleCompletions = totalTopics * users.length;
      const completionPercentage = totalPossibleCompletions > 0 
        ? Math.round((totalCompletedAcrossAllStudents / totalPossibleCompletions) * 100)
        : 0;

      subjectUnits.push({
        id: unit.id,
        name: unit.name,
        totalTopics,
        completedTopics: totalCompletedAcrossAllStudents,
        completionPercentage,
        students,
      });
    }

    result.subjects.push({
      id: subject.id,
      name: subject.name,
      color: subject.color,
      units: subjectUnits,
    });
  }

  return result;
}

export async function adminGetSyllabusDetail(userId: string): Promise<{
  subjects: Array<{
    id: number;
    name: string;
    color: string;
    completionPercentage: number;
    units: Array<{
      id: number;
      name: string;
      completionPercentage: number;
      topics: Array<{
        id: number;
        name: string;
        order: number;
        progress: {
          status: "not_started" | "in_progress" | "completed";
          confidence: "low" | "medium" | "high" | null;
          notes: string | null;
          completedAt: string | null;
          lastRevisedAt: string | null;
        } | null;
      }>;
    }>;
  }>;
}> {
  const supabase = createAdminClient();
  
  // Get syllabus structure
  const syllabus = await adminGetSubjectsWithUnitsAndTopics();
  
  // Get user's progress
  const { data: userProgress, error: progressErr } = await supabase
    .from("user_topic_progress")
    .select("*")
    .eq("user_id", userId);
  if (progressErr) throw progressErr;
  
  // Build a map of topicId -> progress
  const progressMap = new Map<number, UserTopicProgress>();
  for (const p of userProgress ?? []) {
    const progress = toCamel<UserTopicProgress>(p);
    progressMap.set(progress.topicId, progress);
  }

  const result: {
    subjects: Array<{
      id: number;
      name: string;
      color: string;
      completionPercentage: number;
      units: Array<{
        id: number;
        name: string;
        completionPercentage: number;
        topics: Array<{
          id: number;
          name: string;
          order: number;
          progress: {
            status: "not_started" | "in_progress" | "completed";
            confidence: "low" | "medium" | "high" | null;
            notes: string | null;
            completedAt: string | null;
            lastRevisedAt: string | null;
          } | null;
        }>;
      }>;
    }>;
  } = {
    subjects: [],
  };

  for (const subject of syllabus) {
    const subjectUnits: Array<{
      id: number;
      name: string;
      completionPercentage: number;
      topics: Array<{
        id: number;
        name: string;
        order: number;
        progress: {
          status: "not_started" | "in_progress" | "completed";
          confidence: "low" | "medium" | "high" | null;
          notes: string | null;
          completedAt: string | null;
          lastRevisedAt: string | null;
        } | null;
      }>;
    }> = [];

    let subjectCompleted = 0;
    let subjectTotal = 0;

    for (const unit of subject.units) {
      const unitTopics: Array<{
        id: number;
        name: string;
        order: number;
        progress: {
          status: "not_started" | "in_progress" | "completed";
          confidence: "low" | "medium" | "high" | null;
          notes: string | null;
          completedAt: string | null;
          lastRevisedAt: string | null;
        } | null;
      }> = [];

      let unitCompleted = 0;
      const unitTotal = unit.topics.length;

      for (const topic of unit.topics) {
        const progress = progressMap.get(topic.id);
        const topicProgress = progress
          ? {
              status: progress.status as "not_started" | "in_progress" | "completed",
              confidence: progress.confidence as "low" | "medium" | "high" | null,
              notes: progress.notes,
              completedAt: progress.completedAt,
              lastRevisedAt: progress.lastRevisedAt,
            }
          : null;

        unitTopics.push({
          id: topic.id,
          name: topic.name,
          order: topic.order,
          progress: topicProgress,
        });

        if (topicProgress?.status === "completed") {
          unitCompleted++;
          subjectCompleted++;
        }
        subjectTotal++;
      }

      const unitCompletionPercentage = unitTotal > 0 ? Math.round((unitCompleted / unitTotal) * 100) : 0;

      subjectUnits.push({
        id: unit.id,
        name: unit.name,
        completionPercentage: unitCompletionPercentage,
        topics: unitTopics,
      });
    }

    const subjectCompletionPercentage = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0;

    result.subjects.push({
      id: subject.id,
      name: subject.name,
      color: subject.color,
      completionPercentage: subjectCompletionPercentage,
      units: subjectUnits,
    });
  }

  return result;
}

// --- Exam dates (admin CRUD, app-wide) ---

export type ExamDate = { id: number; name: string; examDate: string; displayOrder: number };

export async function adminListExamDates(): Promise<ExamDate[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("exam_dates")
    .select("id, name, exam_date, display_order")
    .order("display_order", { ascending: true })
    .order("exam_date", { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    examDate: (r.exam_date as string).slice(0, 10),
    displayOrder: r.display_order ?? 0,
  }));
}

export async function adminCreateExamDate(data: { name: string; examDate: string; displayOrder?: number }): Promise<ExamDate> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("exam_dates")
    .insert({
      name: data.name,
      exam_date: data.examDate,
      display_order: data.displayOrder ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    name: row.name,
    examDate: (row.exam_date as string).slice(0, 10),
    displayOrder: row.display_order ?? 0,
  };
}

export async function adminUpdateExamDate(
  id: number,
  data: Partial<{ name: string; examDate: string; displayOrder: number }>
): Promise<ExamDate> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (data.examDate != null) payload.exam_date = data.examDate;
  if (data.displayOrder != null) payload.display_order = data.displayOrder;
  const { data: row, error } = await supabase
    .from("exam_dates")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    name: row.name,
    examDate: (row.exam_date as string).slice(0, 10),
    displayOrder: row.display_order ?? 0,
  };
}

export async function adminDeleteExamDate(id: number): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("exam_dates").delete().eq("id", id);
  if (error) throw error;
}

// --- Motivational quotes (admin CRUD, one random shown on dashboard) ---

export type MotivationalQuote = {
  id: number;
  quote: string;
  author: string | null;
  displayOrder: number;
  isActive: boolean;
};

function mapQuoteRow(r: Record<string, unknown>): MotivationalQuote {
  return {
    id: r.id as number,
    quote: r.quote as string,
    author: (r.author as string) ?? null,
    displayOrder: (r.display_order as number) ?? 0,
    isActive: (r.is_active as boolean) ?? true,
  };
}

export async function adminListMotivationalQuotes(): Promise<MotivationalQuote[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("motivational_quotes")
    .select("id, quote, author, display_order, is_active")
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapQuoteRow);
}

export async function adminCreateMotivationalQuote(data: {
  quote: string;
  author?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}): Promise<MotivationalQuote> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("motivational_quotes")
    .insert({
      quote: data.quote,
      author: data.author ?? null,
      display_order: data.displayOrder ?? 0,
      is_active: data.isActive ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return mapQuoteRow(row as Record<string, unknown>);
}

export async function adminUpdateMotivationalQuote(
  id: number,
  data: Partial<{ quote: string; author: string | null; displayOrder: number; isActive: boolean }>
): Promise<MotivationalQuote> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (data.quote != null) payload.quote = data.quote;
  if (data.author !== undefined) payload.author = data.author;
  if (data.displayOrder != null) payload.display_order = data.displayOrder;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  const { data: row, error } = await supabase
    .from("motivational_quotes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapQuoteRow(row as Record<string, unknown>);
}

export async function adminDeleteMotivationalQuote(id: number): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("motivational_quotes").delete().eq("id", id);
  if (error) throw error;
}
