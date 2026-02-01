// Re-export Supabase storage (replaces Drizzle storage)
import * as supabaseStorage from "../lib/supabase-storage";

export const storage = {
  getSubjectsWithUnitsAndTopics: supabaseStorage.getSubjectsWithUnitsAndTopics,
  getTopicProgress: supabaseStorage.getTopicProgress,
  updateTopicProgress: supabaseStorage.updateTopicProgress,
  getDashboardStats: supabaseStorage.getDashboardStats,
  getStudySessions: supabaseStorage.getStudySessions,
  createStudySession: supabaseStorage.createStudySession,
  getRevisionSchedule: supabaseStorage.getRevisionSchedule,
  createRevisionSchedule: supabaseStorage.createRevisionSchedule,
  completeRevision: supabaseStorage.completeRevision,
  completeRevisionSession: supabaseStorage.completeRevisionSession,
  deleteRevisionSchedulesByDate: supabaseStorage.deleteRevisionSchedulesByDate,
  getBacklogItems: supabaseStorage.getBacklogItems,
  createBacklogItem: supabaseStorage.createBacklogItem,
  updateBacklogItem: supabaseStorage.updateBacklogItem,
  deleteBacklogItem: supabaseStorage.deleteBacklogItem,
  getMockTests: supabaseStorage.getMockTests,
  createMockTest: supabaseStorage.createMockTest,
  updateMockTest: supabaseStorage.updateMockTest,
  seedSyllabus: supabaseStorage.seedSyllabus,
};
