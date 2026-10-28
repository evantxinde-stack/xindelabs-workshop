-- Baseline schema audit (READ ONLY). Jalankan di Supabase SQL Editor, tempel hasilnya.
-- Tujuan: tahu kolom & constraint aktual sebelum bikin migration additive.

-- 1. Kolom semua tabel public yang dipakai sistem
select table_name, column_name, data_type,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'classes','lessons','lesson_progress','orders','members','certificates',
    'sales_page_config','page_blocks','vouchers','vip_config','vip_workspace',
    'leads','pipeline_events','email_queue','email_templates','settings',
    'workshop_decks','workshop_pre_sessions','workshop_pre_session_progress',
    'discord_role_map','modules','courses','enrollments','programs','funnels',
    'funnel_steps','affiliates','transactions','vip_bookings','vip_sessions'
  )
order by table_name, ordinal_position;

-- 2. Tabel apa saja yang benar-benar ada di public
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- 3. Constraint unik / primary / check pada tabel kunci
select tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name, cc.check_clause
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
left join information_schema.check_constraints cc
  on cc.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.table_name in ('classes','orders','members','sales_page_config','vouchers')
order by tc.table_name, tc.constraint_type, tc.constraint_name;

-- 4. Enum / tipe custom
select t.typname, e.enumlabel
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
order by t.typname, e.enumsortorder;

-- 5. RLS aktif/tidak per tabel
select relname, relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by relname;
