-- Migration 004: Performance Indexes
-- Run AFTER 003_functions.sql

create index idx_communities_creator on public.communities(creator_id);
create index idx_communities_category on public.communities(category);
create index idx_communities_slug on public.communities(slug);
create index idx_communities_active on public.communities(is_active, member_count desc);

create index idx_memberships_user on public.memberships(user_id, status);
create index idx_memberships_community on public.memberships(community_id, status);
create index idx_memberships_expiry on public.memberships(expires_at) where status = 'active';

create index idx_posts_community_time on public.posts(community_id, created_at desc);
create index idx_posts_pinned on public.posts(community_id, is_pinned) where is_pinned = true;
create index idx_posts_author on public.posts(author_id);

create index idx_comments_post on public.comments(post_id, created_at);
create index idx_post_likes_post on public.post_likes(post_id);

create index idx_courses_community on public.courses(community_id, order_index);
create index idx_lessons_course on public.lessons(course_id, order_index);
create index idx_lesson_completions_user on public.lesson_completions(user_id);
create index idx_lesson_completions_lesson on public.lesson_completions(lesson_id);

create index idx_payments_user on public.payments(user_id, created_at desc);
create index idx_payments_community on public.payments(community_id);
create index idx_payments_atmos on public.payments(atmos_transaction_id) where atmos_transaction_id is not null;

create index idx_earnings_creator on public.creator_earnings_ledger(creator_id, created_at desc);
create index idx_earnings_unpaid on public.creator_earnings_ledger(creator_id) where payout_id is null;

create index idx_payouts_creator on public.creator_payouts(creator_id, period_end desc);
create index idx_points_leaderboard on public.points(community_id, points_total desc);
create index idx_points_user on public.points(user_id);

-- Enable full-text search on communities
alter table public.communities add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored;

create index idx_communities_search on public.communities using gin(search_vector);
