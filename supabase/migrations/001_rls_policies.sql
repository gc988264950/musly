-- =============================================================================
-- Musly — Row Level Security policies
-- =============================================================================
-- Run this entire file in Supabase SQL Editor (once per environment).
-- The script is idempotent: DROP IF EXISTS + CREATE means re-running is safe.
--
-- Access model:
--   teacher  → rows where teacher_id  = auth.uid()
--   student  → rows where student_id  = (jwt → user_metadata → linkedStudentId)::uuid
--   admin    → uses service_role key in server-only routes (bypasses RLS by design)
--   webhook  → uses service_role key (bypasses RLS by design)
--
-- Helper expression for student identity:
--   (auth.jwt() -> 'user_metadata' ->> 'linkedStudentId')::uuid
-- Supabase stores user_metadata in the JWT claims, so this is always available
-- for authenticated student sessions without an extra DB round-trip.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STUDENTS
--    teacher_id column links every student to its teacher.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_students  ON students;
DROP POLICY IF EXISTS student_read_own_record     ON students;

-- Teachers: full CRUD on their own students
CREATE POLICY teacher_full_own_students ON students
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());

-- Students: read-only access to their own student record
-- (needed so the portal can display the student's name, instrument, meet link)
CREATE POLICY student_read_own_record ON students
  FOR SELECT
  USING (id = (auth.jwt() -> 'user_metadata' ->> 'linkedStudentId')::uuid);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. LESSONS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_lessons       ON lessons;
DROP POLICY IF EXISTS student_read_own_lessons        ON lessons;
DROP POLICY IF EXISTS student_update_homework_lessons ON lessons;

-- Teachers: full CRUD
CREATE POLICY teacher_full_own_lessons ON lessons
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());

-- Students: read their own lessons
CREATE POLICY student_read_own_lessons ON lessons
  FOR SELECT
  USING (student_id = (auth.jwt() -> 'user_metadata' ->> 'linkedStudentId')::uuid);

-- Students: can UPDATE their own lessons (required for homework_completed toggle
-- via /api/student/homework which runs under the student's authenticated session).
-- Restricted to own rows only; the API route provides additional column-level
-- validation so only homework_completed is ever mutated by students.
CREATE POLICY student_update_homework_lessons ON lessons
  FOR UPDATE
  USING     (student_id = (auth.jwt() -> 'user_metadata' ->> 'linkedStudentId')::uuid)
  WITH CHECK(student_id = (auth.jwt() -> 'user_metadata' ->> 'linkedStudentId')::uuid);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STUDENT_NOTES  (teacher-private — students must NOT read these)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_notes ON student_notes;

CREATE POLICY teacher_full_own_notes ON student_notes
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. STUDENT_PROGRESS  (teacher-private)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_progress ON student_progress;

CREATE POLICY teacher_full_own_progress ON student_progress
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. STUDENT_FILES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE student_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_files FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_files    ON student_files;
DROP POLICY IF EXISTS student_read_visible_files ON student_files;

-- Teachers: full CRUD on files they uploaded
CREATE POLICY teacher_full_own_files ON student_files
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());

-- Students: read-only for files explicitly marked visible
CREATE POLICY student_read_visible_files ON student_files
  FOR SELECT
  USING (
    student_id        = (auth.jwt() -> 'user_metadata' ->> 'linkedStudentId')::uuid
    AND visible_to_student = true
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. STUDENT_FINANCIAL  (teacher-private — no student access)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE student_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_financial FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_financial ON student_financial;

CREATE POLICY teacher_full_own_financial ON student_financial
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PAYMENTS  (teacher-private)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_payments ON payments;

CREATE POLICY teacher_full_own_payments ON payments
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. LESSON_PLANS  (teacher-private)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_plans ON lesson_plans;

CREATE POLICY teacher_full_own_plans ON lesson_plans
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. REPERTOIRE_ITEMS  (teacher-managed)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE repertoire_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repertoire_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_full_own_repertoire ON repertoire_items;

CREATE POLICY teacher_full_own_repertoire ON repertoire_items
  USING     (teacher_id = auth.uid())
  WITH CHECK(teacher_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. SUBSCRIPTIONS
--     Reads: authenticated user sees own row.
--     Writes: only service_role (webhook, admin routes).
--     Exception: a teacher may downgrade themselves to 'free' (cancellation).
--     Upgrading (pro/studio) must go through webhook — blocked here client-side.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_read_own_subscription     ON subscriptions;
DROP POLICY IF EXISTS user_downgrade_own_subscription ON subscriptions;

-- SELECT: users read their own subscription
CREATE POLICY user_read_own_subscription ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- UPDATE: users may only set plan_id = 'free' (downgrade / cancellation).
-- Upgrades (pro, studio) must come from the webhook or admin route.
CREATE POLICY user_downgrade_own_subscription ON subscriptions
  FOR UPDATE
  USING     (user_id = auth.uid())
  WITH CHECK(user_id = auth.uid() AND plan_id = 'free');


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. AI_CREDIT_USAGE
--     SELECT: own row only (for credit display in the dashboard).
--     UPDATE: own row — needed while consumeCredits() runs client-side.
--     NOTE: Credit deduction should be moved to the server side
--           (/api/ai/chat) in a future hardening pass so that UPDATE
--           can be removed from client-accessible policies entirely.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE ai_credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_usage FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_read_own_credits   ON ai_credit_usage;
DROP POLICY IF EXISTS user_update_own_credits  ON ai_credit_usage;
DROP POLICY IF EXISTS user_insert_own_credits  ON ai_credit_usage;

CREATE POLICY user_read_own_credits ON ai_credit_usage
  FOR SELECT
  USING (user_id = auth.uid());

-- UPDATE and INSERT are needed for the current client-side consumeCredits() path.
-- Risk: users can directly issue UPDATE SET credits_used = 0 via browser.
-- Mitigation: rate limiting on /api/ai/chat (10 req/min) limits blast radius.
-- Recommended: move consumeCredits() to the /api/ai/chat server route.
CREATE POLICY user_update_own_credits ON ai_credit_usage
  FOR UPDATE
  USING     (user_id = auth.uid())
  WITH CHECK(user_id = auth.uid());

CREATE POLICY user_insert_own_credits ON ai_credit_usage
  FOR INSERT
  WITH CHECK(user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. CREDIT_TRANSACTIONS  (append-only log — users read, service_role writes)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_read_own_transactions ON credit_transactions;

CREATE POLICY user_read_own_transactions ON credit_transactions
  FOR SELECT
  USING (user_id = auth.uid());
-- No INSERT/UPDATE/DELETE for users — only service_role can write this table.


-- ─────────────────────────────────────────────────────────────────────────────
-- 13. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_own_notifications ON notifications;

CREATE POLICY user_own_notifications ON notifications
  USING     (user_id = auth.uid())
  WITH CHECK(user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 14. TEACHER_PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_own_teacher_profile ON teacher_profiles;

CREATE POLICY user_own_teacher_profile ON teacher_profiles
  USING     (user_id = auth.uid())
  WITH CHECK(user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 15. USER_SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_own_settings ON user_settings;

CREATE POLICY user_own_settings ON user_settings
  USING     (user_id = auth.uid())
  WITH CHECK(user_id = auth.uid());


-- =============================================================================
-- Webhook idempotency — DB-level unique indexes
-- =============================================================================
-- These prevent duplicate webhook events from being processed even if the
-- application-level idempotency check in the code has a race condition.

-- Unique index on credit_transactions.cakto_order_id
-- The code already checks for duplicates, but this is the hard DB-level guard.
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_cakto_order_id
  ON credit_transactions (cakto_order_id)
  WHERE cakto_order_id IS NOT NULL;

-- Unique index on subscriptions.cakto_order_id
-- Prevents the same Cakto order from writing the same plan row twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_cakto_order_id
  ON subscriptions (cakto_order_id)
  WHERE cakto_order_id IS NOT NULL;


-- =============================================================================
-- Storage bucket RLS  (Supabase Storage)
-- =============================================================================
-- Supabase Storage does NOT use a "storage.policies" table.
-- Policies for file objects are standard PostgreSQL RLS policies on the
-- built-in table storage.objects, filtered by bucket_id.
--
-- Bucket name : student-files
-- Path format : {teacherId}/{fileId}
-- Rule        : teachers access only their own folder (first path segment = uid)
-- =============================================================================

DROP POLICY IF EXISTS teacher_upload_own_files ON storage.objects;
DROP POLICY IF EXISTS teacher_read_own_files   ON storage.objects;
DROP POLICY IF EXISTS teacher_delete_own_files ON storage.objects;

-- Teachers: upload into their own folder
CREATE POLICY teacher_upload_own_files ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Teachers: read files in their own folder
CREATE POLICY teacher_read_own_files ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Teachers: delete files in their own folder
CREATE POLICY teacher_delete_own_files ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
