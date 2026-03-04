"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Settings");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("success");
    setCurrentPassword("");
    setNewPassword("");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              type="password"
              label={t("newPassword")}
              placeholder={t("newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            {status === "success" && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                {t("passwordChanged")}
              </p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}
            <Button type="submit" loading={status === "loading"} disabled={newPassword.length < 6}>
              {t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
