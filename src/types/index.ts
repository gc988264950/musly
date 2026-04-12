// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
}

// ─── Students ────────────────────────────────────────────────────────────────

export type InstrumentType =
  | 'Piano'
  | 'Guitar'
  | 'Violin'
  | 'Voice / Singing'
  | 'Drums / Percussion'
  | 'Bass Guitar'
  | 'Cello'
  | 'Flute'
  | 'Saxophone'
  | 'Trumpet'
  | 'Other'

export type StudentLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type StudentStatus = 'active' | 'inactive' | 'on-hold'

export interface Student {
  id: string
  teacher_id: string
  full_name: string
  email?: string
  phone?: string
  parent_name?: string
  parent_email?: string
  instrument: InstrumentType
  level: StudentLevel
  status: StudentStatus
  lesson_day?: string
  lesson_time?: string
  lesson_duration?: number // minutes
  hourly_rate?: number
  notes?: string
  created_at: string
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show'

export interface Lesson {
  id: string
  student_id: string
  teacher_id: string
  date: string          // ISO date string
  start_time: string    // HH:MM
  duration: number      // minutes
  status: LessonStatus
  notes?: string
  created_at: string
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface ProgressReport {
  id: string
  student_id: string
  teacher_id: string
  title: string
  content: string
  rating: 1 | 2 | 3 | 4 | 5
  shared_with_parent: boolean
  created_at: string
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  student_id: string
  teacher_id: string
  amount: number
  status: PaymentStatus
  due_date: string
  paid_at?: string
  notes?: string
  created_at: string
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export type NavItem = {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string; size?: number }>
  badge?: string | number
}
