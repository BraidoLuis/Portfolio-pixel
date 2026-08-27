create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  problem text not null default '',
  solution text not null default '',
  role text not null default 'Desenvolvedor Full Stack',
  technologies text[] not null default '{}',
  features text[] not null default '{}',
  live_url text,
  repository_url text,
  thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default true,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text not null default '',
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;

drop policy if exists "Admin reads own access" on public.admin_users;
create policy "Admin reads own access"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Published projects are public" on public.projects;
create policy "Published projects are public"
on public.projects for select
to anon, authenticated
using (status = 'published' or public.is_portfolio_admin());

drop policy if exists "Admins insert projects" on public.projects;
create policy "Admins insert projects"
on public.projects for insert
to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "Admins update projects" on public.projects;
create policy "Admins update projects"
on public.projects for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

drop policy if exists "Admins delete projects" on public.projects;
create policy "Admins delete projects"
on public.projects for delete
to authenticated
using (public.is_portfolio_admin());

drop policy if exists "Published project images are public" on public.project_images;
create policy "Published project images are public"
on public.project_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_images.project_id
      and (projects.status = 'published' or public.is_portfolio_admin())
  )
);

drop policy if exists "Admins manage project images" on public.project_images;
create policy "Admins manage project images"
on public.project_images for all
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Project media is public" on storage.objects;
create policy "Project media is public"
on storage.objects for select
to public
using (bucket_id = 'project-media');

drop policy if exists "Admins upload project media" on storage.objects;
create policy "Admins upload project media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-media' and public.is_portfolio_admin());

drop policy if exists "Admins update project media" on storage.objects;
create policy "Admins update project media"
on storage.objects for update
to authenticated
using (bucket_id = 'project-media' and public.is_portfolio_admin())
with check (bucket_id = 'project-media' and public.is_portfolio_admin());

drop policy if exists "Admins delete project media" on storage.objects;
create policy "Admins delete project media"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-media' and public.is_portfolio_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- Depois de criar seu usuário em Authentication > Users, execute:
-- insert into public.admin_users (user_id) values ('COLE-O-UUID-DO-USUARIO');
