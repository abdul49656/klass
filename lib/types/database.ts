export type UserRole = "learner" | "creator" | "admin";
export type LanguagePref = "ru" | "uz" | "en";
export type PlatformTier = "free" | "growth" | "pro";
export type MembershipStatus = "active" | "expired" | "cancelled";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded";
export type PaymentType = "subscription" | "platform_fee";
export type PayoutStatus = "pending" | "processing" | "sent" | "failed";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  language_preference: LanguagePref;
  platform_tier: PlatformTier;
  created_at: string;
}

export interface Community {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  is_paid: boolean;
  price_uzs: number; // in tiyins
  category: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CommunityWithCreator extends Community {
  creator: Pick<User, "id" | "name" | "avatar_url">;
}

export interface Membership {
  id: string;
  user_id: string;
  community_id: string;
  status: MembershipStatus;
  started_at: string;
  expires_at: string | null;
}

export interface Post {
  id: string;
  community_id: string;
  author_id: string;
  content: string;
  images: string[];
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface PostWithAuthor extends Post {
  author: Pick<User, "id" | "name" | "avatar_url">;
  liked_by_user?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, "id" | "name" | "avatar_url">;
}

export interface Course {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  is_locked: boolean;
  order_index: number;
}

export interface CourseWithProgress extends Course {
  lessons: Lesson[];
  completed_count: number;
  total_lessons: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
}

export interface LessonCompletion {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  community_id: string;
  amount_uzs: number; // in tiyins
  status: PaymentStatus;
  atmos_transaction_id: number | null;
  payment_type: PaymentType;
  created_at: string;
}

export interface CreatorEarningsLedger {
  id: string;
  creator_id: string;
  community_id: string;
  learner_payment_id: string | null;
  gross_amount_uzs: number;
  platform_fee_uzs: number;
  creator_share_uzs: number;
  created_at: string;
  payout_id: string | null;
}

export interface CreatorPayout {
  id: string;
  creator_id: string;
  amount_uzs: number;
  period_start: string;
  period_end: string;
  status: PayoutStatus;
  atmos_transaction_id: number | null;
  sent_at: string | null;
}

export interface CreatorPayoutCard {
  id: string;
  creator_id: string;
  card_last_four: string;
  card_holder_name: string;
  atmos_card_token: string;
  is_verified: boolean;
  created_at: string;
}

export interface Points {
  id: string;
  user_id: string;
  community_id: string;
  points_total: number;
  level: number;
  last_updated: string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  points_total: number;
  level: number;
  rank: number;
}

// Categories available for communities — labels are translated via Categories namespace
export const COMMUNITY_CATEGORIES = [
  "business", "technology", "design", "marketing",
  "education", "health", "fitness", "language",
  "finance", "arts", "music", "other",
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

// Platform tier configs
export const PLATFORM_TIERS = {
  free: { label: "Free", price_uzs: 0, platform_cut: 0.1, max_communities: 1 },
  growth: {
    label: "Growth",
    price_uzs: 29900000, // 299 000 UZS/mo in tiyins
    platform_cut: 0.05,
    max_communities: 3,
  },
  pro: {
    label: "Pro",
    price_uzs: 79900000, // 799 000 UZS/mo in tiyins
    platform_cut: 0.02,
    max_communities: 10,
  },
} as const;

// Points per activity
export const POINTS_CONFIG = {
  create_post: 5,
  create_comment: 2,
  complete_lesson: 10,
  receive_like: 1,
  daily_login: 1,
} as const;
