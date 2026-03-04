import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Lock, PlayCircle } from "lucide-react";

interface ClassroomPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: community } = await admin
    .from("communities")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Check membership
  let isMember = false;
  if (authUser) {
    const { data } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", authUser.id)
      .eq("community_id", community.id)
      .eq("status", "active")
      .single();
    isMember = !!data;
  }

  // Get courses with lessons
  const { data: courses } = await admin
    .from("courses")
    .select("*, lessons(id, title, duration_minutes, order_index)")
    .eq("community_id", community.id)
    .order("order_index");

  // Get completions for current user
  let completedLessonIds = new Set<string>();
  if (authUser) {
    const allLessonIds = courses?.flatMap((c) => c.lessons.map((l: any) => l.id)) ?? [];
    if (allLessonIds.length) {
      const { data: completions } = await supabase
        .from("lesson_completions")
        .select("lesson_id")
        .eq("user_id", authUser.id)
        .in("lesson_id", allLessonIds);
      completedLessonIds = new Set(completions?.map((c) => c.lesson_id) ?? []);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Классная комната</h2>

      {!courses?.length && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400">
          <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
          <p>Курсов пока нет</p>
        </div>
      )}

      <div className="space-y-4">
        {courses?.map((course) => {
          const lessons = (course.lessons as any[]).sort(
            (a, b) => a.order_index - b.order_index
          );
          const completedCount = lessons.filter((l) =>
            completedLessonIds.has(l.id)
          ).length;
          const progress =
            lessons.length > 0
              ? Math.round((completedCount / lessons.length) * 100)
              : 0;

          return (
            <div
              key={course.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden"
            >
              {/* Course header */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    {course.is_locked && !isMember && (
                      <Badge variant="default" className="gap-1">
                        <Lock size={10} />
                        Платный
                      </Badge>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-500">{course.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {lessons.length} уроков
                    </span>
                    {authUser && (
                      <span className="text-xs text-gray-400">
                        {completedCount}/{lessons.length} пройдено
                      </span>
                    )}
                  </div>
                </div>
                {authUser && (
                  <div className="w-24 shrink-0 space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-gray-400 text-right">{progress}%</p>
                  </div>
                )}
              </div>

              {/* Lessons list */}
              {lessons.length > 0 && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {lessons.map((lesson: any, idx: number) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isLocked = course.is_locked && !isMember;

                    return (
                      <div key={lesson.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 size={18} className="text-green-500" />
                          ) : isLocked ? (
                            <Lock size={18} className="text-gray-300" />
                          ) : (
                            <PlayCircle size={18} className="text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isLocked ? (
                            <span className="text-sm text-gray-400 line-clamp-1">
                              {lesson.title}
                            </span>
                          ) : (
                            <Link
                              href={`/c/${slug}/classroom/${course.id}/${lesson.id}`}
                              className="text-sm text-gray-800 hover:text-blue-600 transition-colors line-clamp-1"
                            >
                              {lesson.title}
                            </Link>
                          )}
                        </div>
                        {lesson.duration_minutes && (
                          <span className="text-xs text-gray-400 shrink-0">
                            {lesson.duration_minutes} мин
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
