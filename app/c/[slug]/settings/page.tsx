"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMMUNITY_CATEGORIES } from "@/lib/types/database";

export default function CommunitySettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();
  const t = useTranslations("CommunitySettings");
  const tc = useTranslations("Categories");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    is_paid: false,
    price_uzs: 0,
  });
  const [communityId, setCommunityId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: community } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!community || community.creator_id !== user.id) {
        router.push(`/c/${slug}`);
        return;
      }

      setCommunityId(community.id);
      setForm({
        name: community.name,
        description: community.description || "",
        category: community.category,
        is_paid: community.is_paid,
        price_uzs: community.price_uzs,
      });
      setLoading(false);
    }
    load();
  }, [slug, supabase, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!communityId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await supabase
      .from("communities")
      .update({
        name: form.name,
        description: form.description || null,
        category: form.category,
        is_paid: form.is_paid,
        price_uzs: form.is_paid ? form.price_uzs : 0,
      })
      .eq("id", communityId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-400">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("general")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label={t("name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={3}
            />
            <Textarea
              label={t("description")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">{t("category")}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {COMMUNITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {tc(cat)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_paid}
                onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
                id="is_paid"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_paid" className="text-sm font-medium text-gray-700">
                {t("paidCommunity")}
              </label>
            </div>
            {form.is_paid && (
              <Input
                label={t("price")}
                type="number"
                value={form.price_uzs}
                onChange={(e) => setForm({ ...form, price_uzs: Number(e.target.value) })}
              />
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                {t("saved")}
              </p>
            )}
            <Button type="submit" loading={saving}>
              {t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
