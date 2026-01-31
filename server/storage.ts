import { db } from "./db";
import { 
  subjects, units, topics, userTopicProgress, studySessions, revisionSchedules, backlogItems, mockTests, mockTestSubjects,
  type Subject, type Unit, type Topic, type UserTopicProgress, type StudySession, type RevisionSchedule, type BacklogItem,
  type InsertStudySessionSchema, type InsertBacklogItemSchema, type InsertRevisionScheduleSchema,
  type MockTest, type MockTestSubject
} from "@shared/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Syllabus
  getSubjectsWithUnitsAndTopics(): Promise<any[]>;
  getTopicProgress(userId: string): Promise<UserTopicProgress[]>;
  updateTopicProgress(progress: Partial<UserTopicProgress> & { userId: string, topicId: number }): Promise<UserTopicProgress>;
  
  // Dashboard
  getDashboardStats(userId: string): Promise<any>;

  // Study Sessions
  getStudySessions(userId: string): Promise<StudySession[]>;
  createStudySession(session: any): Promise<StudySession>;

  // Revision
  getRevisionSchedule(userId: string): Promise<any[]>;
  createRevisionSchedule(schedule: any): Promise<RevisionSchedule>;
  completeRevision(id: number): Promise<RevisionSchedule | undefined>;

  // Backlog
  getBacklogItems(userId: string): Promise<BacklogItem[]>;
  createBacklogItem(item: any): Promise<BacklogItem>;
  updateBacklogItem(id: number, updates: Partial<BacklogItem>): Promise<BacklogItem | undefined>;
  deleteBacklogItem(id: number): Promise<void>;

  // Mock Tests
  getMockTests(userId: string): Promise<any[]>;
  createMockTest(test: any, subjects: any[]): Promise<any>;

  // Seed
  seedSyllabus(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSubjectsWithUnitsAndTopics(): Promise<any[]> {
    const allSubjects = await db.select().from(subjects);
    const result = [];

    for (const subject of allSubjects) {
      const subjectUnits = await db.select().from(units).where(eq(units.subjectId, subject.id)).orderBy(units.order);
      const unitsWithTopics = [];

      for (const unit of subjectUnits) {
        const unitTopics = await db.select().from(topics).where(eq(topics.unitId, unit.id)).orderBy(topics.order);
        unitsWithTopics.push({ ...unit, topics: unitTopics });
      }
      result.push({ ...subject, units: unitsWithTopics });
    }
    return result;
  }

  async getTopicProgress(userId: string): Promise<UserTopicProgress[]> {
    return await db.select().from(userTopicProgress).where(eq(userTopicProgress.userId, userId));
  }

  async updateTopicProgress(progress: Partial<UserTopicProgress> & { userId: string, topicId: number }): Promise<UserTopicProgress> {
    const [updated] = await db
      .insert(userTopicProgress)
      .values({ ...progress, userId: progress.userId, topicId: progress.topicId } as any)
      .onConflictDoUpdate({
        target: [userTopicProgress.userId, userTopicProgress.topicId],
        set: { ...progress, completedAt: progress.status === 'completed' ? new Date() : null },
      })
      .returning();
    return updated;
  }

  async getDashboardStats(userId: string): Promise<any> {
    const studyHoursResult = await db.select({ 
      total: sql<number>`sum(duration_minutes)` 
    }).from(studySessions).where(eq(studySessions.userId, userId));
    const totalStudyHours = Math.round((studyHoursResult[0]?.total || 0) / 60);

    const questionsSolved = 0; // Placeholder

    // Syllabus Completion
    // This is a rough estimation. Ideally we count total topics vs completed topics per subject.
    const allSubjects = await db.select().from(subjects);
    const syllabusCompletion = [];
    
    for (const subject of allSubjects) {
       // Count total topics
       const totalTopicsResult = await db.select({ count: sql<number>`count(*)` })
        .from(topics)
        .innerJoin(units, eq(topics.unitId, units.id))
        .where(eq(units.subjectId, subject.id));
       
       const completedTopicsResult = await db.select({ count: sql<number>`count(*)` })
        .from(userTopicProgress)
        .innerJoin(topics, eq(userTopicProgress.topicId, topics.id))
        .innerJoin(units, eq(topics.unitId, units.id))
        .where(and(eq(units.subjectId, subject.id), eq(userTopicProgress.userId, userId), eq(userTopicProgress.status, 'completed')));

       const total = Number(totalTopicsResult[0]?.count || 0);
       const completed = Number(completedTopicsResult[0]?.count || 0);
       
       syllabusCompletion.push({
         subjectId: subject.id,
         subjectName: subject.name,
         percentage: total > 0 ? Math.round((completed / total) * 100) : 0
       });
    }

    const revisionDueResult = await db.select({ count: sql<number>`count(*)` })
      .from(revisionSchedules)
      .where(and(eq(revisionSchedules.userId, userId), eq(revisionSchedules.status, 'not_started'), sql`${revisionSchedules.scheduledDate} <= CURRENT_DATE`));
    
    const backlogCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(backlogItems)
      .where(and(eq(backlogItems.userId, userId), eq(backlogItems.isCompleted, false)));

    return {
      totalStudyHours,
      questionsSolved,
      syllabusCompletion,
      revisionDue: Number(revisionDueResult[0]?.count || 0),
      backlogCount: Number(backlogCountResult[0]?.count || 0),
    };
  }

  async getStudySessions(userId: string): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.date));
  }

  async createStudySession(session: any): Promise<StudySession> {
    const [newSession] = await db.insert(studySessions).values(session).returning();
    return newSession;
  }

  async getRevisionSchedule(userId: string): Promise<any[]> {
    return await db.select({
      id: revisionSchedules.id,
      scheduledDate: revisionSchedules.scheduledDate,
      status: revisionSchedules.status,
      topic: topics,
    })
    .from(revisionSchedules)
    .innerJoin(topics, eq(revisionSchedules.topicId, topics.id))
    .where(eq(revisionSchedules.userId, userId))
    .orderBy(revisionSchedules.scheduledDate);
  }

  async createRevisionSchedule(schedule: any): Promise<RevisionSchedule> {
    const [newSchedule] = await db.insert(revisionSchedules).values(schedule).returning();
    return newSchedule;
  }
  
  async completeRevision(id: number): Promise<RevisionSchedule | undefined> {
    const [updated] = await db.update(revisionSchedules)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(revisionSchedules.id, id))
      .returning();
    return updated;
  }

  async getBacklogItems(userId: string): Promise<BacklogItem[]> {
    return await db.select().from(backlogItems).where(eq(backlogItems.userId, userId)).orderBy(desc(backlogItems.createdAt));
  }

  async createBacklogItem(item: any): Promise<BacklogItem> {
    const [newItem] = await db.insert(backlogItems).values(item).returning();
    return newItem;
  }

  async updateBacklogItem(id: number, updates: Partial<BacklogItem>): Promise<BacklogItem | undefined> {
    const [updated] = await db.update(backlogItems).set(updates).where(eq(backlogItems.id, id)).returning();
    return updated;
  }

  async deleteBacklogItem(id: number): Promise<void> {
    await db.delete(backlogItems).where(eq(backlogItems.id, id));
  }

  async getMockTests(userId: string): Promise<any[]> {
    const tests = await db.select().from(mockTests).where(eq(mockTests.userId, userId)).orderBy(desc(mockTests.date));
    const result = [];
    
    for (const test of tests) {
      const testSubjects = await db.select({
        score: mockTestSubjects.score,
        correctCount: mockTestSubjects.correctCount,
        incorrectCount: mockTestSubjects.incorrectCount,
        subject: subjects,
      })
      .from(mockTestSubjects)
      .innerJoin(subjects, eq(mockTestSubjects.subjectId, subjects.id))
      .where(eq(mockTestSubjects.mockTestId, test.id));
      
      result.push({ ...test, subjects: testSubjects });
    }
    return result;
  }

  async createMockTest(test: any, subjectsData: any[]): Promise<any> {
    return await db.transaction(async (tx) => {
      const [newTest] = await tx.insert(mockTests).values(test).returning();
      
      if (subjectsData && subjectsData.length > 0) {
        await tx.insert(mockTestSubjects).values(
          subjectsData.map(s => ({ ...s, mockTestId: newTest.id }))
        );
      }
      return newTest;
    });
  }

  async seedSyllabus(): Promise<void> {
    // Only seed if empty
    const existing = await db.select().from(subjects);
    if (existing.length > 0) return;

    const physics = await db.insert(subjects).values({ name: "Physics", color: "#EF4444" }).returning();
    const chemistry = await db.insert(subjects).values({ name: "Chemistry", color: "#F59E0B" }).returning();
    const maths = await db.insert(subjects).values({ name: "Maths", color: "#3B82F6" }).returning();
    
    // Physics Units & Topics
    const pUnit1 = await db.insert(units).values({ subjectId: physics[0].id, name: "Mechanics", order: 1 }).returning();
    await db.insert(topics).values([
      { unitId: pUnit1[0].id, name: "Kinematics", order: 1 },
      { unitId: pUnit1[0].id, name: "Laws of Motion", order: 2, isImportant: true },
      { unitId: pUnit1[0].id, name: "Work, Energy and Power", order: 3 },
    ]);
    
    // Chemistry Units & Topics
    const cUnit1 = await db.insert(units).values({ subjectId: chemistry[0].id, name: "Physical Chemistry", order: 1 }).returning();
    await db.insert(topics).values([
      { unitId: cUnit1[0].id, name: "Mole Concept", order: 1, isImportant: true },
      { unitId: cUnit1[0].id, name: "Atomic Structure", order: 2 },
      { unitId: cUnit1[0].id, name: "Chemical Equilibrium", order: 3 },
    ]);

     // Maths Units & Topics
    const mUnit1 = await db.insert(units).values({ subjectId: maths[0].id, name: "Algebra", order: 1 }).returning();
    await db.insert(topics).values([
      { unitId: mUnit1[0].id, name: "Quadratic Equations", order: 1 },
      { unitId: mUnit1[0].id, name: "Sequences and Series", order: 2, isImportant: true },
      { unitId: mUnit1[0].id, name: "Complex Numbers", order: 3 },
    ]);
  }
}

export const storage = new DatabaseStorage();
