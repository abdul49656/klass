import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUZS } from "@/lib/utils";
import { COMMUNITY_CATEGORIES } from "@/lib/types/database";
import type { CommunityWithCreator } from "@/lib/types/database";

interface CommunityCardProps {
  community: CommunityWithCreator;
  isMember?: boolean;
}

export function CommunityCard({ community, isMember }: CommunityCardProps) {
  const categoryLabel =
    COMMUNITY_CATEGORIES.find((c) => c.value === community.category)?.label ??
    community.category;

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      {/* Cover image */}
      <Link href={`/c/${community.slug}`} className="block relative h-40 bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
        {community.cover_image ? (
          <Image
            src={community.cover_image}
            alt={community.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-blue-200 select-none">
              {community.name[0]}
            </span>
          </div>
        )}
        {/* Category badge overlay */}
        <div className="absolute top-3 left-3">
          <Badge variant="default" className="bg-white/90 text-gray-700 text-xs">
            {categoryLabel}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <Link
            href={`/c/${community.slug}`}
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {community.name}
          </Link>
          {community.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {community.description}
            </p>
          )}
        </div>

        {/* Creator */}
        <p className="text-xs text-gray-400">
          от {community.creator.name}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={12} />
            <span>{community.member_count.toLocaleString("ru-RU")}</span>
          </div>

          <div className="flex items-center gap-2">
            {community.is_paid ? (
              <span className="text-xs font-medium text-gray-700">
                {formatUZS(community.price_uzs)}/мес
              </span>
            ) : (
              <span className="text-xs font-medium text-green-600">Бесплатно</span>
            )}
            <Button size="sm" variant={isMember ? "secondary" : "primary"} asChild>
              <Link href={`/c/${community.slug}`}>
                {isMember ? "Открыть" : "Вступить"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
