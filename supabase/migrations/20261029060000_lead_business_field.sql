-- Phase 1: preserve existing lead rows while adding the requested business field.
alter table public.leads
  add column if not exists business_field text;
