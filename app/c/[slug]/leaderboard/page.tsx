import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { UserAvatar } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { notFound } from "next/navigation";
import { pointsForNextLevel } from "@/lib/utils";

interface LeaderboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { slug } = await params;
  const admin = createAdminClient();
  const t = await getTranslations("Leaderboard");
  const tl = await getTranslations("Level");

  const { data: community } = await admin
    .from("communities")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const { data: entries } = await admin
    .from("points")
    .select("*, user:users!user_id(id, name, avatar_url)")
    .eq("community_id", community.id)
    .order("points_total", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("heading")}
      </h2>

      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {/* Header */}
        <div className="grid grid-cols-12 px-4 py-2 text-xs text-gray-400 font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-5">{t("member")}</div>
          <div className="col-span-3">{t("level")}</div>
          <div className="col-span-3 text-right">{t("points")}</div>
        </div>

        {entries?.map((entry, i) => {
          const user = (entry as any).user;
          const rank = i + 1;
          const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
          const nextLevelPoints = pointsForNextLevel(entry.level);
          const progress = Math.min(100, (entry.points_total / nextLevelPoints) * 100);

          return (
            <div
              key={entry.user_id}
              className={`grid grid-cols-12 items-center px-4 py-3 ${
                rank <= 3 ? "bg-amber-50/30" : ""
              }`}
            >
              <div className="col-span-1 text-sm font-medium text-gray-500">
                {rankEmoji ?? rank}
              </div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="sm" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </span>
              </div>
              <div className="col-span-3 space-y-1">
                <LevelBadge level={entry.level} label={tl("level", { level: entry.level })} />
                <Progress value={progress} className="h-1" />
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {entry.points_total.toLocaleString("ru-RU")}
                </span>
              </div>
            </div>
          );
        })}

        {!entries?.length && (
          <div className="p-8 text-center text-gray-400">
            {t("empty")}
          </div>
        )}
      </div>
    </div>
  );
}
