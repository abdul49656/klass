-- Migration 001: Initial Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

create extension if not exists "pgcrypto";

-- Users (synced from auth.users via trigger)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar_url text,
  role text not null default 'learner' check (role in ('learner', 'creator', 'admin')),
  language_preference text not null default 'ru' check (language_preference in ('ru', 'uz', 'en')),
  platform_tier text not null default 'free' check (platform_tier in ('free', 'growth', 'pro')),
  created_at timestamptz not null default now()
);

-- Communities
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  cover_image text,
  is_paid boolean not null default false,
  price_uzs bigint not null default 0,
  category text not null,
  member_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Memberships
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, community_id)
);

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  images text[] default '{}',
  is_pinned boolean not null default false,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Post likes (join table)
create table public.post_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null,
  description text,
  is_locked boolean not null default false,
  order_index integer not null default 0
);

-- Lessons
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  duration_minutes integer,
  order_index integer not null default 0
);

-- Lesson completions
create table public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  community_id uuid references public.communities(id),
  amount_uzs bigint not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  atmos_transaction_id bigint,
  payment_type text not null default 'subscription' check (payment_type in ('subscription', 'platform_fee')),
  created_at timestamptz not null default now()
);

-- Creator earnings ledger
create table public.creator_earnings_ledger (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id),
  community_id uuid not null references public.communities(id),
  learner_payment_id uuid references public.payments(id),
  gross_amount_uzs bigint not null,
  platform_fee_uzs bigint not null,
  creator_share_uzs bigint not null,
  created_at timestamptz not null default now(),
  payout_id uuid
);

-- Creator payouts
create table public.creator_payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id),
  amount_uzs bigint not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  atmos_transaction_id bigint,
  sent_at timestamptz
);

-- Creator payout cards
create table public.creator_payout_cards (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  card_last_four text not null,
  card_holder_name text not null,
  atmos_card_token text not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Points / Gamification
create table public.points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  points_total integer not null default 0,
  level integer not null default 1,
  last_updated timestamptz not null default now(),
  unique (user_id, community_id)
);

-- Foreign key: earnings → payouts
alter table public.creator_earnings_ledger
  add constraint fk_payout_id
  foreign key (payout_id) references public.creator_payouts(id);
