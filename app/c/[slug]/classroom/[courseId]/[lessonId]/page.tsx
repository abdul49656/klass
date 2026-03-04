import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { LessonPlayer } from "@/components/classroom/LessonPlayer";
import { MarkCompleteButton } from "@/components/classroom/MarkCompleteButton";

interface LessonPageProps {
  params: Promise<{ slug: string; courseId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, courseId, lessonId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect(`/login?next=/c/${slug}/classroom/${courseId}/${lessonId}`);

  const { data: community } = await admin
    .from("communities")
    .select("id, name")
    .eq("slug", slug)
    .single();
  if (!community) notFound();

  const { data: course } = await admin
    .from("courses")
    .select("*, lessons(id, title, order_index, duration_minutes)")
    .eq("id", courseId)
    .eq("community_id", community.id)
    .single();
  if (!course) notFound();

  // Check membership for locked courses
  if (course.is_locked) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", authUser.id)
      .eq("community_id", community.id)
      .eq("status", "active")
      .single();
    if (!membership) redirect(`/c/${slug}`);
  }

  const { data: lesson } = await admin
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .single();
  if (!lesson) notFound();

  const { data: completion } = await supabase
    .from("lesson_completions")
    .select("id")
    .eq("user_id", authUser.id)
    .eq("lesson_id", lessonId)
    .single();
  const isCompleted = !!completion;

  // Get all lessons sorted for prev/next
  const allLessons = (course.lessons as any[]).sort((a, b) => a.order_index - b.order_index);
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  // Get completions for progress bar
  const { data: completions } = await supabase
    .from("lesson_completions")
    .select("lesson_id")
    .eq("user_id", authUser.id)
    .in("lesson_id", allLessons.map((l: any) => l.id));
  const completedIds = new Set(completions?.map((c) => c.lesson_id) ?? []);
  const progress = Math.round((completedIds.size / allLessons.length) * 100);

  return (
    <div className="flex gap-6 -mt-2">
      {/* Left panel — course tree */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-20">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
              {course.title}
            </h3>
            <div className="mt-2 space-y-1">
              <Progress value={progress} />
              <p className="text-xs text-gray-400">
                {completedIds.size}/{allLessons.length} уроков · {progress}%
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {allLessons.map((l: any) => {
              const done = completedIds.has(l.id);
              const active = l.id === lessonId;
              return (
                <Link
                  key={l.id}
                  href={`/c/${slug}/classroom/${courseId}/${l.id}`}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                  ) : (
                    <Circle size={15} className="text-gray-300 shrink-0" />
                  )}
                  <span className="line-clamp-2">{l.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Video player */}
        {lesson.video_url && <LessonPlayer url={lesson.video_url} />}

        {/* Lesson title + meta */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
              {lesson.duration_minutes && (
                <p className="text-sm text-gray-400 mt-1">
                  {lesson.duration_minutes} минут
                </p>
              )}
            </div>
            <MarkCompleteButton
              lessonId={lessonId}
              communityId={community.id}
              isCompleted={isCompleted}
            />
          </div>

          {/* Content */}
          {lesson.content && (
            <div className="prose prose-sm max-w-none text-gray-700">
              {lesson.content}
            </div>
          )}
        </div>

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between gap-4">
          {prevLesson ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/c/${slug}/classroom/${courseId}/${prevLesson.id}`}>
                <ChevronLeft size={14} />
                Предыдущий
              </Link>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/c/${slug}/classroom`}>
                <ChevronLeft size={14} />
                К курсам
              </Link>
            </Button>
          )}

          {nextLesson && (
            <Button size="sm" asChild>
              <Link href={`/c/${slug}/classroom/${courseId}/${nextLesson.id}`}>
                Следующий
                <ChevronRight size={14} />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
