"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMMUNITY_CATEGORIES } from "@/lib/types/database";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function NewCommunityPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("NewCommunity");
  const tv = useTranslations("Validation");
  const tc = useTranslations("Categories");
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().min(3, tv("communityNameMin")),
    description: z.string().optional(),
    category: z.string().min(1, tv("selectCategory")),
    is_paid: z.boolean(),
    price_uzs: z.number().min(0).optional(),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_paid: false, price_uzs: 0 },
  });

  const isPaid = watch("is_paid");

  async function onSubmit(data: FormData) {
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = slugify(data.name) || `community-${Date.now()}`;

    const { error: insertError } = await supabase.from("communities").insert({
      creator_id: user.id,
      name: data.name,
      slug,
      description: data.description || null,
      category: data.category,
      is_paid: data.is_paid,
      price_uzs: data.is_paid ? (data.price_uzs || 0) * 100 : 0,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/c/${slug}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("name")}
              label={t("name")}
              placeholder={t("namePlaceholder")}
              error={errors.name?.message}
            />
            <Textarea
              {...register("description")}
              label={t("description")}
              placeholder={t("descriptionPlaceholder")}
              error={errors.description?.message}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">{t("category")}</label>
              <select
                {...register("category")}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">{t("selectCategory")}</option>
                {COMMUNITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {tc(cat)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register("is_paid")}
                id="is_paid"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_paid" className="text-sm font-medium text-gray-700">
                {t("paidCommunity")}
              </label>
            </div>
            {isPaid && (
              <Input
                {...register("price_uzs", { valueAsNumber: true })}
                label={t("price")}
                type="number"
                placeholder="99000"
                hint={t("priceHint")}
              />
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              {t("create")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
