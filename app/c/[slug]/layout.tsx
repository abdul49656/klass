import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { cn, formatUZS } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Community, User } from "@/lib/types/database";

interface CommunityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function CommunityLayout({
  children,
  params,
}: CommunityLayoutProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: community } = await adminSupabase
    .from("communities")
    .select("*, creator:users!creator_id(id, name, avatar_url)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!community) notFound();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  let currentUser: User | null = null;
  let isMember = false;

  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    currentUser = data;

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", authUser.id)
      .eq("community_id", community.id)
      .eq("status", "active")
      .single();
    isMember = !!membership;
  }

  const isCreator = currentUser?.id === community.creator_id;

  const tabs = [
    { href: `/c/${slug}`, label: "Сообщество" },
    { href: `/c/${slug}/classroom`, label: "Классная комната" },
    { href: `/c/${slug}/members`, label: "Участники" },
    { href: `/c/${slug}/leaderboard`, label: "Рейтинг" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />

      {/* Community header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Cover */}
          <div className="relative h-36 -mx-4 md:mx-0 md:rounded-b-xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
            {community.cover_image && (
              <Image
                src={community.cover_image}
                alt={community.name}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Info row */}
          <div className="flex items-start justify-between gap-4 py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
              {community.description && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                  {community.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {community.member_count.toLocaleString("ru-RU")} участников
                </span>
                <span>·</span>
                <span>от {(community as any).creator.name}</span>
              </div>
            </div>

            <div className="shrink-0">
              {isCreator ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/c/${slug}/settings`}>Настройки</Link>
                </Button>
              ) : isMember ? (
                <Button variant="secondary" size="sm">
                  Вы участник
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href={`/c/${slug}?join=1`}>
                    {community.is_paid
                      ? `Вступить · ${formatUZS(community.price_uzs)}/мес`
                      : "Вступить бесплатно"}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Nav tabs */}
          <div className="flex items-center gap-1 overflow-x-auto -mx-1">
            {tabs.map((tab) => (
              <CommunityTab key={tab.href} href={tab.href} label={tab.label} />
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}

function CommunityTab({ href, label }: { href: string; label: string }) {
  // Active state is handled client-side — we render as a link for SSR
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap transition-colors"
    >
      {label}
    </Link>
  );
}
