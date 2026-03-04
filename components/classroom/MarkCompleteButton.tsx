"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

interface MarkCompleteButtonProps {
  lessonId: string;
  communityId: string;
  isCompleted: boolean;
}

export function MarkCompleteButton({
  lessonId,
  communityId,
  isCompleted: initialCompleted,
}: MarkCompleteButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (completed) {
        // Uncomplete
        await supabase
          .from("lesson_completions")
          .delete()
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId);
        setCompleted(false);
      } else {
        // Complete
        await supabase
          .from("lesson_completions")
          .upsert({ user_id: user.id, lesson_id: lessonId });
        setCompleted(true);

        // Award points via API
        await fetch("/api/points/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ communityId, event: "complete_lesson" }),
        });
      }

      router.refresh();
    });
  }

  return (
    <Button
      variant={completed ? "secondary" : "primary"}
      size="sm"
      onClick={handleToggle}
      loading={isPending}
      className="shrink-0"
    >
      {completed ? (
        <>
          <CheckCircle2 size={14} className="text-green-500" />
          Пройдено
        </>
      ) : (
        <>
          <Circle size={14} />
          Отметить как пройденное
        </>
      )}
    </Button>
  );
}
