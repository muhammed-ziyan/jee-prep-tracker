export type CurrentLevel = '11' | '12';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  current_level: CurrentLevel;
  created_at: string;
  updated_at: string;
}

export interface StudyLog {
  id: string;
  user_id: string;
  date: string;
  physics_hours: number;
  chemistry_hours: number;
  maths_hours: number;
  questions_solved: number;
  topics_done: string | null;
  productivity: number | null;
  remarks: string | null;
  created_at: string;
}

export type SyllabusStatus = 'done' | 'ongoing' | 'not_started';
export type Confidence = 'high' | 'medium' | 'low';
export type Subject = 'physics' | 'chemistry' | 'maths';

export interface SyllabusTopic {
  id: string;
  user_id: string;
  subject: Subject;
  unit: string;
  topic: string;
  status: SyllabusStatus;
  revision_count: number;
  confidence: Confidence | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Revision {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  last_revised: string | null;
  revision_number: number;
  next_due: string | null;
  confidence: string | null;
  status: 'overdue' | 'on_track' | null;
}

export interface MockTest {
  id: string;
  user_id: string;
  test_date: string;
  total_score: number;
  physics_score: number;
  chemistry_score: number;
  maths_score: number;
  mistake_type: string | null;
  key_learning: string | null;
  next_action: string | null;
  created_at: string;
}

export type BacklogPriority = 'high' | 'medium' | 'low';
export type BacklogStatus = 'pending' | 'in_progress' | 'fixed';

export interface BacklogTopic {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  reason: string | null;
  priority: BacklogPriority;
  fix_deadline: string | null;
  status: BacklogStatus;
  created_at: string;
}
