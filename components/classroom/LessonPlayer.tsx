"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LessonPlayerProps {
  url: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
  }

  return null;
}

export function LessonPlayer({ url }: LessonPlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        Видео недоступно
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 rounded-xl" />
      )}
      <iframe
        src={embedUrl}
        className={cn(
          "absolute inset-0 w-full h-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
