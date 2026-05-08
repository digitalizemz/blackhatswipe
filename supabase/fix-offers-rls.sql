-- ============================================================
-- Fix: RLS blocking service_role on offers / offer_files
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Give service_role explicit full access to the offers table.
-- Service_role should already bypass RLS via the BYPASSRLS attribute,
-- but some Supabase project configurations don't honour it via PostgREST.
-- Adding an explicit policy is belt-and-suspenders and costs nothing.

drop policy if exists "service_role can manage offers" on public.offers;
create policy "service_role can manage offers"
  on public.offers for all to service_role
  using (true) with check (true);

drop policy if exists "service_role can manage offer_files" on public.offer_files;
create policy "service_role can manage offer_files"
  on public.offer_files for all to service_role
  using (true) with check (true);

-- Verify the policies exist
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where tablename in ('offers', 'offer_files')
order by tablename, policyname;
