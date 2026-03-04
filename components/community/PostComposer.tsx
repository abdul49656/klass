"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Send } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types/database";

interface PostComposerProps {
  user: User;
  onSubmit: (content: string) => Promise<void>;
}

export function PostComposer({ user, onSubmit }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      await onSubmit(content.trim());
      setContent("");
      setFocused(false);
    });
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex gap-3">
        <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Что у вас нового?"
            rows={focused ? 3 : 1}
            className="w-full resize-none border-0 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          {focused && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <ImagePlus size={18} />
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFocused(false); setContent(""); }}
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  loading={isPending}
                  disabled={!content.trim()}
                >
                  <Send size={14} />
                  Опубликовать
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
