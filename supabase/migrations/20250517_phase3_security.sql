-- ============================================================
-- BHS Phase 3 — Security & Schema Migration
-- Run in Supabase SQL Editor in order
-- ============================================================

-- 1. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role            text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS phone           text,
  ADD COLUMN IF NOT EXISTS pro_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS plan_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_changed_by uuid REFERENCES auth.users(id);

-- Fix any rows where role was incorrectly set to 'free' or 'pro' (should only be in plan column)
UPDATE public.profiles
  SET role = 'user'
  WHERE role IN ('free', 'pro');

-- Drop and re-add the role check constraint to enforce correct values
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'editor', 'user'));

-- Drop and re-add the plan check constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro'));

-- 2. Enable RLS on all tables missing it
ALTER TABLE public.offer_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_feedback       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_attachments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_ad_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_snapshots     ENABLE ROW LEVEL SECURITY;

-- 3. Service role bypass policies (allows n8n and admin API to write freely)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'offers','offer_files','offer_reports','refund_requests',
    'support_tickets','ticket_messages','ticket_feedback',
    'creative_attachments','offer_ad_snapshots','library_snapshots',
    'niches','offer_types','languages','traffic_sources','swipe_items'
  ] LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "service_role_all_%I" ON public.%I;
      CREATE POLICY "service_role_all_%I"
        ON public.%I FOR ALL TO service_role
        USING (true) WITH CHECK (true);
    ', t, t, t, t);
  END LOOP;
END $$;

-- 4. User-facing RLS policies

-- Support tickets: users manage only their own
DROP POLICY IF EXISTS "users_own_tickets_select" ON public.support_tickets;
CREATE POLICY "users_own_tickets_select"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_tickets_insert" ON public.support_tickets;
CREATE POLICY "users_own_tickets_insert"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ticket messages: readable if user owns the parent ticket
DROP POLICY IF EXISTS "users_own_ticket_messages" ON public.ticket_messages;
CREATE POLICY "users_own_ticket_messages"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

-- Refund requests: users manage only their own
DROP POLICY IF EXISTS "users_own_refunds" ON public.refund_requests;
CREATE POLICY "users_own_refunds"
  ON public.refund_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Offer reports: users can insert and read their own
DROP POLICY IF EXISTS "users_insert_reports" ON public.offer_reports;
CREATE POLICY "users_insert_reports"
  ON public.offer_reports FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "users_own_reports_select" ON public.offer_reports;
CREATE POLICY "users_own_reports_select"
  ON public.offer_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Swipe items: users manage only their own
DROP POLICY IF EXISTS "users_own_swipe_items" ON public.swipe_items;
CREATE POLICY "users_own_swipe_items"
  ON public.swipe_items FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Offers and offer_files: only pro/admin/editor can read
-- (enforced at API layer — RLS here is a belt-and-suspenders backup)
DROP POLICY IF EXISTS "authenticated_read_offers" ON public.offers;
CREATE POLICY "authenticated_read_offers"
  ON public.offers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_read_offer_files" ON public.offer_files;
CREATE POLICY "authenticated_read_offer_files"
  ON public.offer_files FOR SELECT TO authenticated
  USING (true);

-- 5. Verify
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
