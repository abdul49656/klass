import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/ui/badge";
import { Compass } from "lucide-react";

export default async function LearnerDashboard() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  // Get enrolled communities
  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, community:communities!community_id(id, name, slug, cover_image, creator:users!creator_id(name))")
    .eq("user_id", authUser.id)
    .eq("status", "active")
    .order("started_at", { ascending: false });

  const communityIds = memberships?.map((m: any) => m.community.id) ?? [];

  // Get courses and progress per community
  let progressData: Record<string, { completed: number; total: number }> = {};
  if (communityIds.length) {
    const { data: courses } = await admin
      .from("courses")
      .select("id, community_id, lessons(id)")
      .in("community_id", communityIds);

    const allLessonIds = courses?.flatMap((c) => (c.lessons as any[]).map((l: any) => l.id)) ?? [];

    const { data: completions } = await supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("user_id", authUser.id)
      .in("lesson_id", allLessonIds);

    const completedIds = new Set(completions?.map((c) => c.lesson_id) ?? []);

    for (const community of communityIds) {
      const commCourses = courses?.filter((c) => c.community_id === community) ?? [];
      const lessons = commCourses.flatMap((c) => c.lessons as any[]);
      const completed = lessons.filter((l: any) => completedIds.has(l.id)).length;
      progressData[community] = { completed, total: lessons.length };
    }
  }

  // Get points per community
  const { data: points } = await supabase
    .from("points")
    .select("*")
    .eq("user_id", authUser.id)
    .in("community_id", communityIds);

  const pointsMap = new Map(points?.map((p) => [p.community_id, p]) ?? []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Мои сообщества</h1>
        <p className="text-gray-500 mt-0.5">
          Привет, {currentUser?.name}! Продолжайте учиться.
        </p>
      </div>

      {/* Communities */}
      {!memberships?.length ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center space-y-4">
          <p className="text-gray-400">Вы ещё не вступили ни в одно сообщество</p>
          <Button asChild>
            <Link href="/explore">
              <Compass size={16} />
              Найти сообщество
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((m: any) => {
            const community = m.community;
            const prog = progressData[community.id] ?? { completed: 0, total: 0 };
            const progressPct =
              prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
            const pts = pointsMap.get(community.id);

            return (
              <div
                key={m.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-24 bg-gradient-to-br from-blue-100 to-indigo-100" />
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {community.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      от {community.creator.name}
                    </p>
                  </div>

                  {prog.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Прогресс</span>
                        <span>{prog.completed}/{prog.total} уроков</span>
                      </div>
                      <Progress value={progressPct} />
                    </div>
                  )}

                  {pts && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{pts.points_total} очков</span>
                      <LevelBadge level={pts.level} />
                    </div>
                  )}

                  <Button variant="secondary" size="sm" className="w-full" asChild>
                    <Link href={`/c/${community.slug}`}>Открыть</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
