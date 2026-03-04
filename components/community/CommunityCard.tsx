"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatUZS } from "@/lib/utils";
import type { CommunityWithCreator } from "@/lib/types/database";

interface CommunityCardProps {
  community: CommunityWithCreator;
  isMember?: boolean;
  rank?: number;
}

export function CommunityCard({ community, isMember, rank }: CommunityCardProps) {
  const t = useTranslations("CommunityCard");

  const memberCount = community.member_count >= 1000
    ? `${(community.member_count / 1000).toFixed(1).replace(/\.0$/, "")}k`
    : community.member_count.toString();

  const priceLabel = community.is_paid
    ? `${formatUZS(community.price_uzs)}${t("perMonth")}`
    : t("free");

  return (
    <Link
      href={`/c/${community.slug}`}
      className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 group"
    >
      {/* Cover image with rank badge */}
      <div className="relative h-44 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
        {community.cover_image ? (
          <Image
            src={community.cover_image}
            alt={community.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-blue-200/60 select-none">
              {community.name[0]}
            </span>
          </div>
        )}
        {/* Rank badge */}
        {rank && (
          <div className="absolute top-3 left-3 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
            #{rank}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Avatar + Name row */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
            {community.creator.avatar_url ? (
              <Image
                src={community.creator.avatar_url}
                alt={community.creator.name}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                {community.creator.name?.[0] || "?"}
              </div>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1 text-[15px]">
            {community.name}
          </h3>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {community.description}
          </p>
        )}

        {/* Footer: member count + price */}
        <p className="text-sm text-gray-400 pt-1">
          {memberCount} {t("members")}
          {community.is_paid && (
            <>
              <span className="mx-1.5">·</span>
              <span>{priceLabel}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
