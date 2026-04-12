/**
 * Mock authentication for local development.
 * Persists users and sessions via localStorage + cookies (for middleware).
 * Replace each function body with Supabase calls when integrating.
 *
 * TODO (Supabase): Replace with @supabase/ssr + supabase.auth.*
 */

const SESSION_COOKIE = 'harmoniq-session'
const ROLE_COOKIE = 'harmoniq-role'          // read by middleware for role-based routing
const USERS_PREFIX = 'harmoniq_user_'        // teacher accounts: keyed by email
const SESSION_KEY = 'harmoniq_session'
const STUDENT_ACCOUNTS_KEY = 'harmoniq_student_accounts'  // student accounts: JSON array

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'professor' | 'aluno'

export interface MockUser {
  id: string
  email: string
  firstName: string
  lastName: string
  instrument?: string
  role: UserRole
  linkedStudentId?: string   // only set for role='aluno'
  createdAt: string
}

interface StoredTeacherUser extends MockUser {
  passwordHash: string
}

/** Student accounts created by teachers inside Settings */
export interface StoredStudentAccount extends MockUser {
  passwordHash: string
  teacherId: string  // who created this account
}

export interface MockSession {
  user: MockUser
  token: string
  expiresAt: number
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setSessionCookies(token: string, role: UserRole) {
  const maxAge = 7 * 24 * 60 * 60
  document.cookie = `${SESSION_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function clearSessionCookies() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`
}

// ─── Password helpers (mock only — not secure) ────────────────────────────────

function hashPassword(password: string): string {
  return btoa(encodeURIComponent(password))
}

function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash
}

// ─── Session ─────────────────────────────────────────────────────────────────

function createSession(user: MockUser): void {
  const token = crypto.randomUUID()
  const session: MockSession = {
    user,
    token,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  setSessionCookies(token, user.role)
}

export function getSession(): MockSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session: MockSession = JSON.parse(raw)
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      clearSessionCookies()
      return null
    }
    // Backward compat: sessions created before role was added default to 'professor'
    if (!session.user.role) session.user.role = 'professor'
    return session
  } catch {
    return null
  }
}

export function getCurrentUser(): MockUser | null {
  return getSession()?.user ?? null
}

// ─── Teacher auth operations ──────────────────────────────────────────────────

export function signUp(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  instrument?: string
}): MockUser {
  const email = data.email.toLowerCase().trim()
  if (localStorage.getItem(USERS_PREFIX + email)) {
    throw new Error('Este e-mail já está cadastrado.')
  }

  const user: MockUser = {
    id: crypto.randomUUID(),
    email,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    instrument: data.instrument || undefined,
    role: 'professor',
    createdAt: new Date().toISOString(),
  }

  const stored: StoredTeacherUser = { ...user, passwordHash: hashPassword(data.password) }
  localStorage.setItem(USERS_PREFIX + email, JSON.stringify(stored))
  createSession(user)
  return user
}

export function logIn(email: string, password: string): MockUser {
  const normalizedEmail = email.toLowerCase().trim()

  // 1. Check teacher accounts first
  const teacherRaw = localStorage.getItem(USERS_PREFIX + normalizedEmail)
  if (teacherRaw) {
    const stored: StoredTeacherUser = JSON.parse(teacherRaw)
    if (!verifyPassword(password, stored.passwordHash)) {
      throw new Error('E-mail ou senha incorretos.')
    }
    const { passwordHash: _, ...user } = stored
    const userWithRole: MockUser = { ...user, role: 'professor' }
    createSession(userWithRole)
    return userWithRole
  }

  // 2. Check student accounts
  const studentAccounts = getStudentAccounts()
  const studentAccount = studentAccounts.find((a) => a.email === normalizedEmail)
  if (studentAccount) {
    if (!verifyPassword(password, studentAccount.passwordHash)) {
      throw new Error('E-mail ou senha incorretos.')
    }
    const { passwordHash: _, teacherId: __, ...user } = studentAccount
    createSession(user)
    return user
  }

  throw new Error('E-mail ou senha incorretos.')
}

export function logOut(): void {
  localStorage.removeItem(SESSION_KEY)
  clearSessionCookies()
}

export function updateUser(
  userId: string,
  data: Partial<Pick<MockUser, 'firstName' | 'lastName' | 'email' | 'instrument'>>
): MockUser {
  const session = getSession()
  if (!session || session.user.id !== userId) throw new Error('Não autorizado.')

  const oldEmail = session.user.email
  const raw = localStorage.getItem(USERS_PREFIX + oldEmail)
  if (!raw) throw new Error('Usuário não encontrado.')

  const stored: StoredTeacherUser = JSON.parse(raw)
  const updated: StoredTeacherUser = { ...stored, ...data }
  const newEmail = (data.email ?? oldEmail).toLowerCase().trim()

  if (newEmail !== oldEmail) localStorage.removeItem(USERS_PREFIX + oldEmail)
  localStorage.setItem(USERS_PREFIX + newEmail, JSON.stringify({ ...updated, email: newEmail }))

  const { passwordHash: _, ...updatedUser } = { ...updated, email: newEmail }
  const newSession: MockSession = { ...session, user: updatedUser }
  localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))

  return updatedUser
}

// ─── Student account management (called by teachers in Settings) ─────────────
// TODO (Supabase): Replace with supabase.auth.admin.createUser / deleteUser

export function getStudentAccounts(): StoredStudentAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STUDENT_ACCOUNTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Returns student accounts created by a specific teacher. */
export function getStudentAccountsByTeacher(teacherId: string): StoredStudentAccount[] {
  return getStudentAccounts().filter((a) => a.teacherId === teacherId)
}

export function createStudentAccount(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  linkedStudentId: string
  teacherId: string
}): StoredStudentAccount {
  const email = data.email.toLowerCase().trim()
  const all = getStudentAccounts()

  // Check uniqueness across both teacher and student accounts
  if (localStorage.getItem(USERS_PREFIX + email)) {
    throw new Error('Este e-mail já está em uso por uma conta de professor.')
  }
  if (all.some((a) => a.email === email)) {
    throw new Error('Este e-mail já está em uso por uma conta de aluno.')
  }

  const account: StoredStudentAccount = {
    id: crypto.randomUUID(),
    email,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    role: 'aluno',
    linkedStudentId: data.linkedStudentId,
    teacherId: data.teacherId,
    passwordHash: hashPassword(data.password),
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(STUDENT_ACCOUNTS_KEY, JSON.stringify([...all, account]))
  return account
}

export function deleteStudentAccount(accountId: string): void {
  const all = getStudentAccounts().filter((a) => a.id !== accountId)
  localStorage.setItem(STUDENT_ACCOUNTS_KEY, JSON.stringify(all))
}
