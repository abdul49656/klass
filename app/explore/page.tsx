import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/layout/navbar";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CommunityCardSkeleton } from "@/components/ui/skeleton";
import { COMMUNITY_CATEGORIES } from "@/lib/types/database";
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
        <p className="text-lg font-medium">Сообщества не найдены</p>
        <p className="text-sm mt-1">Попробуйте другую категорию или поисковый запрос</p>
      </div>
    );
  }

  return (
    <>
      {communities.map((c) => (
        <CommunityCard
          key={c.id}
          community={c as CommunityWithCreator}
          isMember={memberCommunityIds.has(c.id)}
        />
      ))}
    </>
  );
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;

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
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Обзор сообществ</h1>
            <p className="text-gray-500 mt-1">
              Найдите своё сообщество и начните учиться
            </p>
          </div>

          {/* Search */}
          <form className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Поиск сообществ..."
              className="w-full h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>

          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <CategoryChip
              label="Все"
              href="/explore"
              active={!params.category}
            />
            {COMMUNITY_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.value}
                label={cat.label}
                href={`/explore?category=${cat.value}${params.q ? `&q=${params.q}` : ""}`}
                active={params.category === cat.value}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Suspense
            fallback={Array.from({ length: 8 }).map((_, i) => (
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
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      {label}
    </a>
  );
}
