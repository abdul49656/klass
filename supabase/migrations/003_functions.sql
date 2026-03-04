-- Migration 003: Database Functions and Triggers
-- Run AFTER 002_rls_policies.sql

-- Auto-create user profile when someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'learner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Award points and recalculate level atomically
create or replace function public.award_points(
  p_user_id uuid,
  p_community_id uuid,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.points (user_id, community_id, points_total, level)
  values (p_user_id, p_community_id, p_points, greatest(1, floor(sqrt(p_points / 100.0))::integer))
  on conflict (user_id, community_id) do update
    set
      points_total = points.points_total + p_points,
      level = greatest(1, floor(sqrt((points.points_total + p_points) / 100.0))::integer),
      last_updated = now();
end;
$$;

-- Increment member_count when membership is created
create or replace function public.update_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'active' then
    update public.communities
    set member_count = member_count + 1
    where id = NEW.community_id;

  elsif TG_OP = 'UPDATE' then
    if OLD.status != 'active' and NEW.status = 'active' then
      update public.communities
      set member_count = member_count + 1
      where id = NEW.community_id;
    elsif OLD.status = 'active' and NEW.status != 'active' then
      update public.communities
      set member_count = greatest(0, member_count - 1)
      where id = NEW.community_id;
    end if;

  elsif TG_OP = 'DELETE' and OLD.status = 'active' then
    update public.communities
    set member_count = greatest(0, member_count - 1)
    where id = OLD.community_id;
  end if;

  return null;
end;
$$;

create trigger trg_membership_count
  after insert or update or delete on public.memberships
  for each row execute function public.update_member_count();

-- Increment likes_count on post atomically
create or replace function public.increment_likes(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set likes_count = likes_count + 1 where id = post_id;
end;
$$;

-- Decrement likes_count on post atomically
create or replace function public.decrement_likes(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set likes_count = greatest(0, likes_count - 1) where id = post_id;
end;
$$;

-- Increment comments_count on post when comment added
create or replace function public.update_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = greatest(0, comments_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create trigger trg_comments_count
  after insert or delete on public.comments
  for each row execute function public.update_comments_count();

-- Increment member count (used by webhook)
create or replace function public.increment_member_count(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.communities
  set member_count = member_count + 1
  where id = p_community_id;
end;
$$;
