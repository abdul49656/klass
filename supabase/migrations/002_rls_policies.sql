-- Migration 002: Row Level Security Policies
-- Run AFTER 001_initial_schema.sql

-- Helper: is current user an active member of this community?
create or replace function public.is_member(p_community_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and community_id = p_community_id
      and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

-- Helper: is current user the creator of this community?
create or replace function public.is_creator(p_community_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.communities
    where id = p_community_id and creator_id = auth.uid()
  );
$$;

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.communities enable row level security;
alter table public.memberships enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.payments enable row level security;
alter table public.creator_earnings_ledger enable row level security;
alter table public.creator_payouts enable row level security;
alter table public.creator_payout_cards enable row level security;
alter table public.points enable row level security;

-- USERS
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
-- Service role can read all (for admin operations)
create policy "users_service_all" on public.users for all using (auth.role() = 'service_role');

-- COMMUNITIES: public read, creator manages
create policy "communities_read_active" on public.communities
  for select using (is_active = true);
create policy "communities_creator_all" on public.communities
  for all using (creator_id = auth.uid());
create policy "communities_service_all" on public.communities
  for all using (auth.role() = 'service_role');

-- MEMBERSHIPS
create policy "memberships_read_own" on public.memberships
  for select using (user_id = auth.uid());
create policy "memberships_creator_reads" on public.memberships
  for select using (is_creator(community_id));
create policy "memberships_service_all" on public.memberships
  for all using (auth.role() = 'service_role');

-- POSTS: members and creator can read; members can write their own
create policy "posts_read_members" on public.posts
  for select using (is_member(community_id) or is_creator(community_id));
create policy "posts_insert_members" on public.posts
  for insert with check (
    auth.uid() = author_id and (is_member(community_id) or is_creator(community_id))
  );
create policy "posts_update_own" on public.posts
  for update using (author_id = auth.uid());
create policy "posts_delete_own_or_creator" on public.posts
  for delete using (author_id = auth.uid() or is_creator(community_id));
create policy "posts_service_all" on public.posts
  for all using (auth.role() = 'service_role');

-- COMMENTS
create policy "comments_read_members" on public.comments
  for select using (
    exists (
      select 1 from public.posts
      where id = post_id and (is_member(community_id) or is_creator(community_id))
    )
  );
create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "comments_delete_own" on public.comments
  for delete using (author_id = auth.uid());

-- POST LIKES
create policy "likes_read_members" on public.post_likes
  for select using (
    exists (
      select 1 from public.posts
      where id = post_id and (is_member(community_id) or is_creator(community_id))
    )
  );
create policy "likes_manage_own" on public.post_likes
  for all using (user_id = auth.uid());

-- COURSES
create policy "courses_read_all" on public.courses
  for select using (
    exists (
      select 1 from public.communities where id = community_id and is_active = true
    )
  );
create policy "courses_creator_all" on public.courses
  for all using (is_creator(community_id));
create policy "courses_service_all" on public.courses
  for all using (auth.role() = 'service_role');

-- LESSONS: unlocked = anyone in community; locked = members only
create policy "lessons_read_unlocked" on public.lessons
  for select using (
    exists (
      select 1 from public.courses where id = course_id and is_locked = false
    )
  );
create policy "lessons_read_locked_members" on public.lessons
  for select using (
    exists (
      select 1 from public.courses c
      join public.communities com on com.id = c.community_id
      where c.id = course_id
        and (is_member(com.id) or is_creator(com.id))
    )
  );
create policy "lessons_creator_all" on public.lessons
  for all using (
    exists (
      select 1 from public.courses where id = course_id and is_creator(community_id)
    )
  );
create policy "lessons_service_all" on public.lessons
  for all using (auth.role() = 'service_role');

-- LESSON COMPLETIONS
create policy "completions_read_own" on public.lesson_completions
  for select using (user_id = auth.uid());
create policy "completions_insert_own" on public.lesson_completions
  for insert with check (user_id = auth.uid());
create policy "completions_delete_own" on public.lesson_completions
  for delete using (user_id = auth.uid());
create policy "completions_service_all" on public.lesson_completions
  for all using (auth.role() = 'service_role');

-- PAYMENTS
create policy "payments_read_own" on public.payments
  for select using (user_id = auth.uid());
create policy "payments_service_all" on public.payments
  for all using (auth.role() = 'service_role');

-- CREATOR EARNINGS
create policy "earnings_read_own_creator" on public.creator_earnings_ledger
  for select using (creator_id = auth.uid());
create policy "earnings_service_all" on public.creator_earnings_ledger
  for all using (auth.role() = 'service_role');

-- CREATOR PAYOUTS
create policy "payouts_read_own" on public.creator_payouts
  for select using (creator_id = auth.uid());
create policy "payouts_service_all" on public.creator_payouts
  for all using (auth.role() = 'service_role');

-- CREATOR PAYOUT CARDS
create policy "cards_manage_own" on public.creator_payout_cards
  for all using (creator_id = auth.uid());
create policy "cards_service_all" on public.creator_payout_cards
  for all using (auth.role() = 'service_role');

-- POINTS
create policy "points_read_community" on public.points
  for select using (is_member(community_id) or is_creator(community_id));
create policy "points_service_all" on public.points
  for all using (auth.role() = 'service_role');
