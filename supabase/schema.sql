-- ============================================================
-- Black Hat Swipe — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- LOOKUP / REFERENCE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.niches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text,
  color      text,
  active     bool        NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offer_types (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  active     bool        NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.languages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  code       text,
  flag_emoji text,
  active     bool        NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.traffic_sources (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  active     bool        NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text        NOT NULL,
  full_name       text,
  phone           text,
  plan            text        NOT NULL DEFAULT 'free',
  role            text        NOT NULL DEFAULT 'user',
  pro_expires_at  timestamptz,
  plan_changed_at timestamptz,
  plan_changed_by uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- OFFERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text        NOT NULL,
  niche_id       uuid        REFERENCES public.niches(id) ON DELETE SET NULL,
  type_id        uuid        REFERENCES public.offer_types(id) ON DELETE SET NULL,
  language_id    uuid        REFERENCES public.languages(id) ON DELETE SET NULL,
  status         text        NOT NULL DEFAULT 'active',
  is_winning     bool        NOT NULL DEFAULT false,
  scaling_status text,
  thumbnail_url  text,
  url            text,
  platform       text,
  description    text,
  today_ads      int         NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view offers"  ON public.offers;
DROP POLICY IF EXISTS "Authenticated users can read offers"  ON public.offers;
DROP POLICY IF EXISTS "authenticated_read_offers"            ON public.offers;
CREATE POLICY "authenticated_read_offers"
  ON public.offers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "service_role can manage offers"       ON public.offers;
DROP POLICY IF EXISTS "service_role_all_offers"              ON public.offers;
CREATE POLICY "service_role_all_offers"
  ON public.offers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- OFFER FILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offer_files (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id        uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  folder_name     text        NOT NULL,
  file_name       text        NOT NULL,
  file_url        text        NOT NULL,
  file_type       text,
  file_size       bigint,
  uploaded_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  creative_status text,
  scrape_status   text,
  post_url        text,
  views           int,
  likes           int,
  comments        int,
  screenshot_url  text,
  last_scraped_at timestamptz,
  cpm_estimated   numeric,
  target_market   text,
  initial_views   int,
  initial_likes   int,
  initial_comments int,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read offer_files"              ON public.offer_files;
DROP POLICY IF EXISTS "authenticated_read_offer_files"     ON public.offer_files;
CREATE POLICY "authenticated_read_offer_files"
  ON public.offer_files FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "service_role can manage offer_files" ON public.offer_files;
DROP POLICY IF EXISTS "service_role_all_offer_files"        ON public.offer_files;
CREATE POLICY "service_role_all_offer_files"
  ON public.offer_files FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- OFFER REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offer_reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id     uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  problem_type text        NOT NULL,
  description  text,
  status       text        NOT NULL DEFAULT 'open',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_reports"       ON public.offer_reports;
CREATE POLICY "users_insert_reports"
  ON public.offer_reports FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "users_own_reports_select"   ON public.offer_reports;
CREATE POLICY "users_own_reports_select"
  ON public.offer_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_offer_reports" ON public.offer_reports;
CREATE POLICY "service_role_all_offer_reports"
  ON public.offer_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- OFFER AD SNAPSHOTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offer_ad_snapshots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id      uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  ad_count      int         NOT NULL DEFAULT 0,
  snapshot_date date        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, snapshot_date)
);

ALTER TABLE public.offer_ad_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_offer_ad_snapshots" ON public.offer_ad_snapshots;
CREATE POLICY "service_role_all_offer_ad_snapshots"
  ON public.offer_ad_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_offer_ad_snapshots" ON public.offer_ad_snapshots;
CREATE POLICY "authenticated_read_offer_ad_snapshots"
  ON public.offer_ad_snapshots FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- LIBRARY SNAPSHOTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.library_snapshots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id      uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  snapshot_date date        NOT NULL,
  data          jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_library_snapshots" ON public.library_snapshots;
CREATE POLICY "service_role_all_library_snapshots"
  ON public.library_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- CREATIVES  (legacy — superseded by offer_files)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creatives (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   uuid        REFERENCES public.offers(id) ON DELETE SET NULL,
  platform   text,
  niche      text,
  angle      text,
  media_url  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view creatives" ON public.creatives;
CREATE POLICY "Authenticated users can view creatives"
  ON public.creatives FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- CREATIVE ATTACHMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creative_attachments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid        NOT NULL REFERENCES public.offer_files(id) ON DELETE CASCADE,
  name        text,
  url         text        NOT NULL,
  file_type   text,
  file_size   bigint,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_creative_attachments" ON public.creative_attachments;
CREATE POLICY "service_role_all_creative_attachments"
  ON public.creative_attachments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_creative_attachments" ON public.creative_attachments;
CREATE POLICY "authenticated_read_creative_attachments"
  ON public.creative_attachments FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- SWIPE ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.swipe_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_id      uuid        REFERENCES public.offers(id) ON DELETE SET NULL,
  title         text        NOT NULL,
  url           text,
  image_url     text,
  thumbnail_url text,
  niche         text,
  type          text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.swipe_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own swipe items" ON public.swipe_items;
DROP POLICY IF EXISTS "users_own_swipe_items"            ON public.swipe_items;
CREATE POLICY "users_own_swipe_items"
  ON public.swipe_items FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email    text,
  subject       text        NOT NULL,
  category      text,
  priority      text        NOT NULL DEFAULT 'normal',
  status        text        NOT NULL DEFAULT 'open',
  assigned_to   uuid,
  assigned_name text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_tickets_select" ON public.support_tickets;
CREATE POLICY "users_own_tickets_select"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_tickets_insert" ON public.support_tickets;
CREATE POLICY "users_own_tickets_insert"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_support_tickets" ON public.support_tickets;
CREATE POLICY "service_role_all_support_tickets"
  ON public.support_tickets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- TICKET MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id   uuid,
  sender_name text,
  sender_role text,
  message     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_ticket_messages" ON public.ticket_messages;
CREATE POLICY "users_own_ticket_messages"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_all_ticket_messages" ON public.ticket_messages;
CREATE POLICY "service_role_all_ticket_messages"
  ON public.ticket_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- TICKET FEEDBACK
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_feedback (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating     int         NOT NULL,
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_ticket_feedback" ON public.ticket_feedback;
CREATE POLICY "service_role_all_ticket_feedback"
  ON public.ticket_feedback FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- REFUND REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email  text,
  reason      text,
  description text,
  status      text        NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_refunds" ON public.refund_requests;
CREATE POLICY "users_own_refunds"
  ON public.refund_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_refund_requests" ON public.refund_requests;
CREATE POLICY "service_role_all_refund_requests"
  ON public.refund_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS offers_niche_id_idx              ON public.offers(niche_id);
CREATE INDEX IF NOT EXISTS offers_status_idx                ON public.offers(status);
CREATE INDEX IF NOT EXISTS offer_files_offer_id_idx         ON public.offer_files(offer_id);
CREATE INDEX IF NOT EXISTS offer_reports_offer_id_idx       ON public.offer_reports(offer_id);
CREATE INDEX IF NOT EXISTS offer_reports_status_idx         ON public.offer_reports(status);
CREATE INDEX IF NOT EXISTS offer_ad_snapshots_offer_id_idx  ON public.offer_ad_snapshots(offer_id);
CREATE INDEX IF NOT EXISTS library_snapshots_offer_id_idx   ON public.library_snapshots(offer_id);
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx      ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx       ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx    ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS refund_requests_user_id_idx      ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS swipe_items_user_id_idx          ON public.swipe_items(user_id);
CREATE INDEX IF NOT EXISTS creative_attachments_creative_id_idx ON public.creative_attachments(creative_id);

-- ============================================================
-- Schema last synced: Phase 3 audit fix
-- Tables defined: profiles, offers, offer_types, niches, languages, traffic_sources,
--   offer_files, offer_reports, support_tickets, ticket_messages, ticket_feedback,
--   refund_requests, creative_attachments, offer_ad_snapshots, library_snapshots, swipe_items
-- ============================================================
