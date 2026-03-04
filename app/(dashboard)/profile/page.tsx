import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar, Shield } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const t = await getTranslations("Profile");

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!currentUser) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={currentUser.name}
              avatarUrl={currentUser.avatar_url}
              size="lg"
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentUser.name}
              </h2>
              <Badge variant={currentUser.role === "creator" ? "primary" : "default"}>
                {t(currentUser.role)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-gray-400" />
            <div>
              <p className="text-gray-500">{t("email")}</p>
              <p className="font-medium text-gray-900">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield size={16} className="text-gray-400" />
            <div>
              <p className="text-gray-500">{t("role")}</p>
              <p className="font-medium text-gray-900">{t(currentUser.role)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className="text-gray-500">{t("joined")}</p>
              <p className="font-medium text-gray-900">
                {new Date(currentUser.created_at).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
