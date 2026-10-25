-- Siap-tempel untuk SQL Editor Supabase (sudah diisi nilai produksi).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-emails-every-5m',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://tutorial-evantxinde-1113s-projects.vercel.app/api/cron/send-email',
    headers := '{"Content-Type":"application/json","x-cron-secret":"hermes-cron-2026"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);