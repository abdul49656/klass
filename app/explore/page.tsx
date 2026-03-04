import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CommunityCardSkeleton } from "@/components/ui/skeleton";
import { COMMUNITY_CATEGORIES, CATEGORY_EMOJIS } from "@/lib/types/database";
import type { CommunityWithCreator, User } from "@/lib/types/database";
import { Search } from "lucide-react";

interface ExplorePageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

async function CommunitiesGrid({
  category,
  query,
  currentUserId,
}: {
  category?: string;
  query?: string;
  currentUserId?: string;
}) {
  const supabase = createAdminClient();
  const t = await getTranslations("Explore");

  let dbQuery = supabase
    .from("communities")
    .select("*, creator:users!creator_id(id, name, avatar_url)")
    .eq("is_active", true)
    .order("member_count", { ascending: false })
    .limit(48);

  if (category) dbQuery = dbQuery.eq("category", category);
  if (query) dbQuery = dbQuery.ilike("name", `%${query}%`);

  const { data: communities } = await dbQuery;

  // Get current user's memberships
  let memberCommunityIds = new Set<string>();
  if (currentUserId) {
    const { data: memberships } = await supabase
      .from("memberships")
      .select("community_id")
      .eq("user_id", currentUserId)
      .eq("status", "active");
    memberCommunityIds = new Set(memberships?.map((m) => m.community_id) ?? []);
  }

  if (!communities?.length) {
    return (
      <div className="col-span-full text-center py-16 text-gray-400">
        <p className="text-lg font-medium">{t("empty")}</p>
        <p className="text-sm mt-1">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <>
      {communities.map((c, index) => (
        <CommunityCard
          key={c.id}
          community={c as CommunityWithCreator}
          isMember={memberCommunityIds.has(c.id)}
          rank={index + 1}
        />
      ))}
    </>
  );
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const t = await getTranslations("Explore");
  const tc = await getTranslations("Categories");

  let authUser = null;
  let currentUser: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data.user;
    if (authUser) {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      currentUser = userData;
    }
  } catch {
    // Supabase not configured yet
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={currentUser} />

      <main className="max-w-5xl mx-auto px-4 pt-12 pb-16">
        {/* Header — centered like Skool */}
        <div className="text-center mb-10 space-y-5">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              {t("heading")}
            </h1>
            <p className="text-gray-400 mt-2">
              {t("subtitlePrefix")}{" "}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                {t("subtitleLink")}
              </Link>
            </p>
          </div>

          {/* Search — centered & prominent */}
          <form className="relative max-w-xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
              size={20}
            />
            <input
              name="q"
              defaultValue={params.q}
              placeholder={t("searchPlaceholder")}
              className="w-full h-12 pl-12 pr-5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </form>

          {/* Category chips with emojis */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <CategoryChip
              label={t("all")}
              href="/explore"
              active={!params.category}
            />
            {COMMUNITY_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat}
                label={`${CATEGORY_EMOJIS[cat]} ${tc(cat)}`}
                href={`/explore?category=${cat}${params.q ? `&q=${params.q}` : ""}`}
                active={params.category === cat}
              />
            ))}
          </div>
        </div>

        {/* Grid — 3 columns like Skool */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Suspense
            fallback={Array.from({ length: 6 }).map((_, i) => (
              <CommunityCardSkeleton key={i} />
            ))}
          >
            <CommunitiesGrid
              category={params.category}
              query={params.q}
              currentUserId={authUser?.id}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function CategoryChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
    </a>
  );
}
