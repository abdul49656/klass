"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Pin } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { relativeTime, cn } from "@/lib/utils";
import type { PostWithAuthor, CommentWithAuthor } from "@/lib/types/database";

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId?: string;
  onLike?: (postId: string, liked: boolean) => Promise<void>;
}

export function PostCard({ post, currentUserId, onLike }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_user ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    if (!currentUserId) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : c - 1));
    startTransition(async () => {
      await onLike?.(post.id, newLiked);
    });
  }

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
          <Pin size={12} />
          Закреплено
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <UserAvatar
          name={post.author.name}
          avatarUrl={post.author.avatar_url}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
          <p className="text-xs text-gray-400">{relativeTime(post.created_at)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div
          className={cn(
            "grid gap-2 rounded-lg overflow-hidden",
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {post.images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative aspect-video bg-gray-100">
              <Image src={img} alt="" fill className="object-cover" />
              {i === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                  +{post.images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
        <button
          onClick={handleLike}
          disabled={!currentUserId || isPending}
          className={cn(
            "flex items-center gap-1.5 text-sm transition-colors",
            liked
              ? "text-red-500 hover:text-red-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <MessageCircle size={16} />
          <span>{post.comments_count}</span>
        </button>
      </div>

      {/* Comments (placeholder — expanded separately) */}
      {showComments && (
        <div className="text-sm text-gray-400 italic pt-2 border-t border-gray-50">
          Комментарии загружаются...
        </div>
      )}
    </article>
  );
}
