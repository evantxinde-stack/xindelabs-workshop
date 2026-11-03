-- Free signups were stamped payment_option='lifetime' by the column default,
-- which read as an all-access/never-expiring member. tier is authoritative
-- (see src/lib/membership-access.ts), so the default is removed; free rows
-- get NULL until a real purchase writes annual/lifetime.
alter table public.members alter column payment_option drop default;
alter table public.members alter column payment_option drop not null;
update public.members set payment_option = null where status = 'free' and paid_until is null;
