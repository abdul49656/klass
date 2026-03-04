import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUZS } from "@/lib/utils";
import { Users, BookOpen, MessageSquare, ExternalLink, Settings } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageCommunityPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const t = await getTranslations("ManageCommunity");

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: community } = await admin
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();

  if (!community) notFound();
  if (community.creator_id !== authUser.id) redirect("/creator");

  // Get stats
  const { count: memberCount } = await admin
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("community_id", id)
    .eq("status", "active");

  const { data: courses } = await admin
    .from("courses")
    .select("id, title, order_index, lessons(id)")
    .eq("community_id", id)
    .order("order_index");

  const { count: postCount } = await admin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("community_id", id);

  const totalLessons = courses?.reduce(
    (sum, c) => sum + (c.lessons as any[]).length,
    0
  ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{community.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/c/${community.slug}`}>
              <ExternalLink size={14} />
              {t("view")}
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/c/${community.slug}/settings`}>
              <Settings size={14} />
              {t("settings")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{memberCount ?? 0}</p>
                <p className="text-xs text-gray-500">{t("members")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
                <p className="text-xs text-gray-500">{t("lessons")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{postCount ?? 0}</p>
                <p className="text-xs text-gray-500">{t("posts")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t("courses")}</h2>
          <Badge variant={community.is_paid ? "primary" : "success"}>
            {community.is_paid ? formatUZS(community.price_uzs) + t("perMonth") : t("free")}
          </Badge>
        </div>
        {!courses?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-400">
              {t("noCourses")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-xs text-gray-500">
                        {(course.lessons as any[]).length} {t("lessonsCount")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
