import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { UserAvatar } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

interface MembersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { slug } = await params;
  const admin = createAdminClient();
  const t = await getTranslations("Members");
  const tl = await getTranslations("Level");

  const { data: community } = await admin
    .from("communities")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const { data: memberships } = await admin
    .from("memberships")
    .select("*, user:users!user_id(id, name, avatar_url, created_at)")
    .eq("community_id", community.id)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(50);

  // Get points
  const { data: pointsData } = await admin
    .from("points")
    .select("user_id, points_total, level")
    .eq("community_id", community.id);

  const pointsMap = new Map(
    pointsData?.map((p) => [p.user_id, { points: p.points_total, level: p.level }]) ?? []
  );

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("heading")} · {memberships?.length ?? 0}
      </h2>

      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {memberships?.map((m) => {
          const user = (m as any).user;
          const pts = pointsMap.get(user.id);
          return (
            <div key={m.id} className="flex items-center gap-4 p-4">
              <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">
                  {t("memberSince", {
                    date: new Date(m.started_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  })}
                </p>
              </div>
              {pts && (
                <div className="text-right shrink-0 space-y-1">
                  <LevelBadge level={pts.level} label={tl("level", { level: pts.level })} />
                  <p className="text-xs text-gray-400">{t("points", { count: pts.points })}</p>
                </div>
              )}
            </div>
          );
        })}
        {!memberships?.length && (
          <div className="p-8 text-center text-gray-400">
            {t("empty")}
          </div>
        )}
      </div>
    </div>
  );
}
