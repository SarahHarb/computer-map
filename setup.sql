-- ======================================================
--  إعداد قاعدة البيانات — انسخي كل هاد الملف والصقيه في
--  Supabase ← SQL Editor ← New query ← Run
-- ======================================================

-- 1) بيانات الطلاب
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  student_no text,
  email text,
  role text not null default 'student',
  created_at timestamptz not null default now()
);

-- 2) إجابات الأسئلة
create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  concept text,
  question text,
  answer text,
  correct_answer text,
  is_correct boolean,
  created_at timestamptz not null default now()
);

-- 3) المفاهيم اللي فتحها الطالب (شرح / فيديو / أسئلة)
create table if not exists public.views (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  concept text,
  tab text,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_idx on public.attempts (user_id, created_at);
create index if not exists views_user_idx on public.views (user_id, created_at);

-- 4) لما طالب يعمل حساب، بينعمله سطر في profiles تلقائياً
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, student_no, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'student_no', new.email)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4ب) التسجيل مسموح بس بإيميل الجامعة
create or replace function public.only_ppu_emails()
returns trigger language plpgsql as $$
begin
  if new.email is null or new.email !~* '@ppu\.edu\.ps$' then
    raise exception 'Only @ppu.edu.ps emails are allowed';
  end if;
  return new;
end $$;
drop trigger if exists only_ppu_emails on auth.users;
create trigger only_ppu_emails before insert on auth.users
  for each row execute function public.only_ppu_emails();

-- 5) هل المستخدم الحالي أدمن؟
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 6) الصلاحيات: الطالب بيشوف ويضيف بياناته بس، والأدمن بيشوف الكل
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.views    enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "attempts read" on public.attempts;
create policy "attempts read" on public.attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "attempts add" on public.attempts;
create policy "attempts add" on public.attempts for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "views read" on public.views;
create policy "views read" on public.views for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "views add" on public.views;
create policy "views add" on public.views for insert to authenticated
  with check (user_id = auth.uid());

-- الأدمن بيقدر يحذف بيانات طالب (مثلاً لتصفير النتائج)
drop policy if exists "attempts admin delete" on public.attempts;
create policy "attempts admin delete" on public.attempts for delete to authenticated using (public.is_admin());
drop policy if exists "views admin delete" on public.views;
create policy "views admin delete" on public.views for delete to authenticated using (public.is_admin());

-- ======================================================
--  7) بعد ما تعملي حسابك من الموقع (حساب جديد)، شغّلي هاد السطر
--     لوحده، بعد ما تحطي إيميلك مكان YOUR_EMAIL:
--
--  update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
-- ======================================================
