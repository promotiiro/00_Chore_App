export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Member {
  id: number;
  name: string;
  color: string;
  created_at?: string;
}

export interface Chore {
  id: number;
  title: string;
  description?: string | null;
  assigned_to?: number | null;
  start_date: string;         // ISO date YYYY-MM-DD
  end_date?: string | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_days?: number[] | null; // 0=Sun … 6=Sat, used by 'weekly'
  start_time?: string | null;        // HH:mm, optional
  end_time?: string | null;          // HH:mm, optional
  created_at?: string;
}

export interface Completion {
  id: number;
  chore_id: number;
  occurrence_date: string;    // ISO date of the completed instance
  completed_by?: number | null;
  note?: string | null;
  completed_at: string;
}

export interface CompletionWithMember extends Completion {
  member_name?: string | null;
  member_color?: string | null;
}

export interface ChoreOccurrence {
  chore: Chore;
  member?: Member | null;
  date: string;               // ISO date of this occurrence
  completion?: Completion | null;
}
