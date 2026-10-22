-- Jalankan lewat SQL Editor SETELAH app ter-deploy.
-- Ganti <APP_URL> dengan domain produksi dan <CRON_SECRET> dengan isi CRON_SECRET di Vercel.
-- (pg_net membuat request HTTP keluar dari Supabase ke app tiap 5 menit.)

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-emails-every-5m',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<APP_URL>/api/cron/send-email',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);