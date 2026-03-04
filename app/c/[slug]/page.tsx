import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/community/PostCard";
import { PostComposer } from "@/components/community/PostComposer";
import { PostSkeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { PostWithAuthor, User } from "@/lib/types/database";

interface CommunityFeedProps {
  params: Promise<{ slug: string }>;
}

async function FeedPosts({
  communityId,
  currentUserId,
}: {
  communityId: string;
  currentUserId?: string;
}) {
  const admin = createAdminClient();
  const t = await getTranslations("Community");

  // Pinned posts first, then chronological
  const { data: posts } = await admin
    .from("posts")
    .select("*, author:users!author_id(id, name, avatar_url)")
    .eq("community_id", communityId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // Get likes by current user
  let likedIds = new Set<string>();
  if (currentUserId && posts?.length) {
    const { data: likes } = await admin
      .from("post_likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", posts.map((p) => p.id));
    likedIds = new Set(likes?.map((l) => l.post_id) ?? []);
  }

  if (!posts?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">{t("feedEmpty")}</p>
        <p className="text-sm mt-1">{t("feedEmptyHint")}</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={{ ...post, liked_by_user: likedIds.has(post.id) } as PostWithAuthor}
          currentUserId={currentUserId}
        />
      ))}
    </>
  );
}

async function Leaderboard({ communityId }: { communityId: string }) {
  const admin = createAdminClient();
  const t = await getTranslations("Community");
  const tl = await getTranslations("Level");
  const { data } = await admin
    .from("points")
    .select("*, user:users!user_id(id, name, avatar_url)")
    .eq("community_id", communityId)
    .order("points_total", { ascending: false })
    .limit(5);

  if (!data?.length) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">{t("topMembers")}</h3>
      <div className="space-y-2">
        {data.map((entry, i) => (
          <div key={entry.user_id} className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-4 shrink-0">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
            </span>
            <UserAvatar
              name={(entry as any).user.name}
              avatarUrl={(entry as any).user.avatar_url}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {(entry as any).user.name}
              </p>
            </div>
            <LevelBadge level={entry.level} label={tl("level", { level: entry.level })} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CommunityFeedPage({ params }: CommunityFeedProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const t = await getTranslations("Community");

  const { data: community } = await admin
    .from("communities")
    .select("id, name, member_count, is_paid, price_uzs")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  let currentUser: User | null = null;
  let isMember = false;

  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    currentUser = data;

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", authUser.id)
      .eq("community_id", community.id)
      .eq("status", "active")
      .single();
    isMember = !!membership;
  }

  const isCreator = currentUser?.id !== undefined;
  const canPost = isMember || isCreator;

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0 space-y-4">
        {canPost && currentUser && (
          <PostComposer user={currentUser} onSubmit={async () => {}} />
        )}

        {!isMember && !isCreator && (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center space-y-3">
            <p className="text-gray-600 font-medium">
              {t("joinPrompt")}
            </p>
          </div>
        )}

        <Suspense
          fallback={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          }
        >
          {(isMember || isCreator) && (
            <FeedPosts
              communityId={community.id}
              currentUserId={authUser?.id}
            />
          )}
        </Suspense>
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 space-y-4">
        {/* Stats */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("sidebarMembers")}</span>
            <span className="font-semibold text-gray-900">
              {community.member_count.toLocaleString("ru-RU")}
            </span>
          </div>
          {community.is_paid && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("sidebarCost")}</span>
              <span className="font-semibold text-gray-900">
                {Math.round(community.price_uzs / 100).toLocaleString("ru-RU")} {t("perMonth")}
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <Suspense fallback={null}>
          <Leaderboard communityId={community.id} />
        </Suspense>
      </aside>
    </div>
  );
}
