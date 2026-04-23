// ─── Instruments & Levels ────────────────────────────────────────────────────
// Defined as const arrays so they drive both types and UI selects.

export const INSTRUMENTS = [
  'Piano',
  'Violão',
  'Guitarra',
  'Violino',
  'Violoncelo',
  'Canto',
  'Bateria',
  'Contrabaixo',
  'Flauta',
  'Saxofone',
  'Trompete',
  'Outro',
] as const
export type Instrument = (typeof INSTRUMENTS)[number]

export const LEVELS = ['Iniciante', 'Intermediário', 'Avançado'] as const
export type StudentLevel = (typeof LEVELS)[number]

// ─── Student ─────────────────────────────────────────────────────────────────

export const STUDENT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#84cc16', // lime
] as const
export type StudentColor = (typeof STUDENT_COLORS)[number]

export const CONTRACT_DURATIONS = [
  { value: 1,  label: '1 mês' },
  { value: 3,  label: '3 meses' },
  { value: 6,  label: '6 meses' },
  { value: 12, label: '12 meses' },
] as const
export type ContractDuration = 1 | 3 | 6 | 12

export interface Student {
  id: string
  teacherId: string
  name: string
  instrument: string
  level: StudentLevel
  email: string         // '' when not provided
  phone: string         // '' when not provided
  notes: string         // '' when not provided
  objectives: string    // '' when not provided
  nextSteps: string     // '' when not provided
  color: string         // hex color
  needsAttention: boolean
  meetLink: string      // '' when not provided (Google Meet or other video call URL)
  // Recurring schedule & contract
  scheduleDays: number[]        // [1,3] = Mon + Wed (0=Sun … 6=Sat); [] = no schedule
  scheduleTime: string          // "HH:MM"; '' when not set
  scheduleDuration: number      // minutes; 0 when not set
  contractDuration: ContractDuration | null
  contractStartDate: string     // "YYYY-MM-DD"; '' when not set (real contract start, may be retroactive)
  contractEndDate: string       // "YYYY-MM-DD"; '' when not set (derived from start + duration)
  createdAt: string
  updatedAt: string
}

export type CreateStudentInput = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateStudentInput = Partial<Omit<CreateStudentInput, 'teacherId'>>

// ─── Student Notes ────────────────────────────────────────────────────────────

export interface StudentNote {
  id: string
  studentId: string
  teacherId: string
  content: string
  createdAt: string
  updatedAt: string
}

export type CreateNoteInput = Omit<StudentNote, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateNoteInput = Pick<StudentNote, 'content'>

// ─── Student Progress ─────────────────────────────────────────────────────────

export interface StudentProgress {
  id: string
  studentId: string
  teacherId: string
  evolution: string
  lessonFrequency: string
  identifiedDifficulties: string[]
  developedSkills: string[]
  updatedAt: string
}

export type UpsertProgressInput = Omit<StudentProgress, 'id' | 'updatedAt'>

// ─── Repertoire ───────────────────────────────────────────────────────────────

export const REPERTOIRE_TYPES = ['Música', 'Exercício', 'Estudo', 'Peça', 'Outro'] as const
export type RepertoireItemType = (typeof REPERTOIRE_TYPES)[number]

export const REPERTOIRE_STATUSES = [
  { value: 'em andamento', label: 'Em andamento' },
  { value: 'concluído', label: 'Concluído' },
  { value: 'pausado', label: 'Pausado' },
] as const
export type RepertoireItemStatus = 'em andamento' | 'concluído' | 'pausado'

export interface RepertoireItem {
  id: string
  studentId: string
  teacherId: string
  title: string
  type: RepertoireItemType
  status: RepertoireItemStatus
  notes: string  // '' when not provided
  createdAt: string
  updatedAt: string
}

export type CreateRepertoireInput = Omit<RepertoireItem, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateRepertoireInput = Partial<Omit<CreateRepertoireInput, 'studentId' | 'teacherId'>>

// ─── Lesson ──────────────────────────────────────────────────────────────────

export const LESSON_STATUSES = [
  { value: 'agendada', label: 'Agendada' },
  { value: 'concluída', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'falta', label: 'Falta' },
] as const
export type LessonStatus = 'agendada' | 'concluída' | 'cancelada' | 'falta'

export const LESSON_DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
] as const

export interface Lesson {
  id: string
  teacherId: string
  studentId: string
  date: string    // "YYYY-MM-DD"
  time: string    // "HH:MM"
  duration: number
  instrument: string
  topic: string   // '' when not provided
  notes: string   // '' when not provided
  status: LessonStatus
  performanceTags: string[]   // e.g. ['difficulty', 'evolved'] — set during lesson mode
  homework: string            // '' when not set
  homeworkSentAt: string | null  // ISO date when homework was sent; null = not sent
  homeworkCompleted: boolean  // true when student marks homework as done
  // Back-reference to the recurring schedule that generated this lesson ('' = manual)
  scheduleGroupId: string
  createdAt: string
  updatedAt: string
}

export type CreateLessonInput = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'performanceTags' | 'homework' | 'homeworkSentAt' | 'homeworkCompleted' | 'scheduleGroupId'> & {
  performanceTags?: string[]
  homework?: string
  homeworkSentAt?: string | null
  homeworkCompleted?: boolean
  scheduleGroupId?: string
}
export type UpdateLessonInput = Partial<Omit<CreateLessonInput, 'teacherId'>>

// ─── Lesson Plan (AI) ─────────────────────────────────────────────────────────

export const LESSON_FOCUSES = [
  { value: 'misto',        label: 'Aula Mista' },
  { value: 'tecnica',      label: 'Técnica' },
  { value: 'repertorio',   label: 'Repertório' },
  { value: 'teoria',       label: 'Teoria Musical' },
  { value: 'improvisacao', label: 'Improvisação' },
  { value: 'leitura',      label: 'Leitura de Partitura' },
  { value: 'ritmo',        label: 'Rítmica' },
] as const
export type LessonFocus = 'misto' | 'tecnica' | 'repertorio' | 'teoria' | 'improvisacao' | 'leitura' | 'ritmo'

export interface LessonPlanSection {
  id: string
  title: string
  emoji: string
  duration: number   // minutes
  activities: string[]
}

export interface LessonPlan {
  id: string
  studentId: string
  teacherId: string
  lessonId: string    // '' = not tied to a specific lesson (legacy AI plans)
  // Inputs captured at generation time
  duration: 30 | 45 | 60
  focus: LessonFocus
  level: StudentLevel
  difficulties: string[]
  objectives: string
  teacherObservation: string
  // Generated content (editable after generation)
  title: string
  summary: string
  sections: LessonPlanSection[]
  // Structured planning blocks (teacher-editable)
  planObjective: string       // Objetivo da aula
  planContent: string         // Conteúdo
  planExercises: string       // Exercícios
  planObservations: string    // Observações
  // Continuity blocks (teacher-editable)
  planPending: string         // O que ficou pendente da aula anterior
  planNextLesson: string      // O que deve acontecer na próxima aula
  // Meta
  createdAt: string
  updatedAt: string
}

export type CreateLessonPlanInput = Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'lessonId' | 'planObjective' | 'planContent' | 'planExercises' | 'planObservations' | 'planPending' | 'planNextLesson'> & {
  lessonId?: string
  planObjective?: string
  planContent?: string
  planExercises?: string
  planObservations?: string
  planPending?: string
  planNextLesson?: string
}
export type UpdateLessonPlanInput = Partial<Pick<LessonPlan, 'sections' | 'title' | 'summary' | 'teacherObservation' | 'planObjective' | 'planContent' | 'planExercises' | 'planObservations' | 'planPending' | 'planNextLesson'>>

// ─── Financial ────────────────────────────────────────────────────────────────

export interface StudentFinancial {
  id: string
  studentId: string
  teacherId: string
  monthlyFee: number      // BRL (e.g., 200.00)
  dueDayOfMonth: number   // 1–28
  paymentLink?: string    // optional payment URL (e.g. Pix, MercadoPago)
  contactLink?: string    // optional WhatsApp / contact URL
  updatedAt: string
}

export type CreateFinancialInput = Omit<StudentFinancial, 'id' | 'updatedAt'>
export type UpdateFinancialInput = Partial<Pick<StudentFinancial, 'monthlyFee' | 'dueDayOfMonth' | 'paymentLink' | 'contactLink'>>

export type PaymentStatus = 'pago' | 'pendente' | 'atrasado'

export interface Payment {
  id: string
  studentId: string
  teacherId: string
  referenceMonth: string   // "YYYY-MM"
  dueDate: string          // "YYYY-MM-DD"
  paidAt: string | null    // ISO date string when payment was registered, null if unpaid
  amount: number           // BRL (may differ from monthly fee)
  notes: string
  createdAt: string
  updatedAt: string
}

export type CreatePaymentInput = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePaymentInput = Partial<Pick<Payment, 'paidAt' | 'amount' | 'notes' | 'dueDate'>>

// ─── User Settings ────────────────────────────────────────────────────────────

export interface UserSettings {
  id: string          // same as userId
  userId: string
  firstName: string
  lastName: string
  email: string
  teachingMethod: string  // injected into AI lesson plan generation
  updatedAt: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'student_created'
  | 'student_deleted'
  | 'lesson_generated'
  | 'plan_saved'
  | 'payment_registered'
  | 'needs_attention'
  | 'no_lesson_days'
  | 'repeated_difficulty'
  | 'upcoming_lesson'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  message: string
  entityId?: string   // related record id (optional)
  read: boolean
  createdAt: string
}

// ─── Student Files ────────────────────────────────────────────────────────────
export interface StudentFile {
  id:               string
  studentId:        string
  teacherId:        string
  name:             string    // original filename
  mimeType:         string    // e.g. 'application/pdf', 'image/png'
  size:             number    // bytes
  storagePath:      string    // Supabase Storage path: '{teacherId}/{fileId}'
  visibleToStudent: boolean   // true = student can see and download this file
  createdAt:        string    // ISO
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'pro' | 'studio'

export interface UserSubscription {
  id: string
  userId: string
  planId: PlanId

  // ── Billing status ─────────────────────────────────────────────────────────
  /** 'active' = plan is in effect · 'expired' = past expiry · 'cancelled' = refunded */
  status: 'active' | 'inactive' | 'expired' | 'cancelled'

  /** ISO string — when this subscription period started */
  startedAt: string

  /** ISO string — when this subscription period ends. null = no expiry (free plan). */
  expiresAt: string | null

  /** ISO string — last renewal date, if applicable */
  renewedAt: string | null

  /** Which payment provider processed this subscription */
  billingProvider: 'manual' | 'cakto' | null

  /** Cakto order/transaction ID for reference & support */
  caktoOrderId: string | null

  /** Customer email used in Cakto checkout — used for webhook matching */
  caktoCustomerEmail: string | null

  // ── Legacy field (kept for backwards compat) ───────────────────────────────
  simulatedAt?: string

  updatedAt: string
}
