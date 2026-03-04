import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUZS } from "@/lib/utils";
import { Users, TrendingUp, DollarSign, PlusCircle, ExternalLink } from "lucide-react";

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const t = await getTranslations("Creator");

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (currentUser?.role !== "creator") redirect("/learner");

  // Get creator's communities
  const { data: communities } = await admin
    .from("communities")
    .select("*, memberships:memberships(count)")
    .eq("creator_id", authUser.id)
    .order("created_at", { ascending: false });

  // Get total stats
  const totalMembers = communities?.reduce((sum, c) => sum + c.member_count, 0) ?? 0;

  // Get earnings summary
  const { data: earningsData } = await admin
    .from("creator_earnings_ledger")
    .select("creator_share_uzs")
    .eq("creator_id", authUser.id)
    .is("payout_id", null);

  const pendingBalance = earningsData?.reduce(
    (sum, e) => sum + e.creator_share_uzs,
    0
  ) ?? 0;

  // Recent members
  const { data: recentMembers } = await admin
    .from("memberships")
    .select("*, user:users!user_id(id, name, avatar_url), community:communities!community_id(name, slug)")
    .in("community_id", communities?.map((c) => c.id) ?? [])
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("heading")}
          </h1>
          <p className="text-gray-500 mt-0.5">
            {t("greeting", { name: currentUser?.name })}
          </p>
        </div>
        <Button asChild>
          <Link href="/creator/new-community">
            <PlusCircle size={16} />
            {t("newCommunity")}
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={20} className="text-blue-600" />}
          label={t("totalMembers")}
          value={totalMembers.toLocaleString("ru-RU")}
          sub={t("inCommunities", { count: communities?.length ?? 0 })}
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-green-600" />}
          label={t("communities")}
          value={String(communities?.length ?? 0)}
          sub={t("active")}
        />
        <StatCard
          icon={<DollarSign size={20} className="text-amber-600" />}
          label={t("pendingBalance")}
          value={formatUZS(pendingBalance)}
          sub={t("payoutSchedule")}
        />
      </div>

      {/* Communities */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">{t("myCommunities")}</h2>
        {!communities?.length && (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <p>{t("noCommunities")}</p>
              <Button className="mt-3" asChild>
                <Link href="/creator/new-community">
                  {t("createFirst")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {communities?.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{community.name}</CardTitle>
                  <Badge variant={community.is_paid ? "primary" : "success"}>
                    {community.is_paid ? formatUZS(community.price_uzs) + t("perMonth") : t("free")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {community.member_count} {t("totalMembers").toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/c/${community.slug}`}>
                      <ExternalLink size={13} />
                      {t("open")}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/creator/communities/${community.id}`}>
                      {t("manage")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent members */}
      {recentMembers && recentMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">{t("recentMembers")}</h2>
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {recentMembers.map((m: any) => (
              <div key={m.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                  <p className="text-xs text-gray-400">
                    {t("joinedIn", {
                      community: m.community.name,
                      date: new Date(m.started_at).toLocaleDateString("ru-RU"),
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
