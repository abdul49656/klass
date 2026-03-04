"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FadeInUp } from "@/components/ui/motion";
import { cn, slugify } from "@/lib/utils";
import { COMMUNITY_CATEGORIES } from "@/lib/types/database";
import { CheckCircle2 } from "lucide-react";

type CreatorForm = {
  bio?: string;
  community_name: string;
  community_description?: string;
  category: string;
};
type Step = "welcome" | "creator-setup" | "learner-interests" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Auth.onboarding");
  const tv = useTranslations("Validation");
  const tc = useTranslations("Categories");
  const [role, setRole] = useState<"creator" | "learner" | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const creatorSchema = z.object({
    bio: z.string().max(200).optional(),
    community_name: z.string().min(3, tv("communityNameMin")).max(60),
    community_description: z.string().max(500).optional(),
    category: z.string().min(1, tv("selectCategory")),
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setRole((user.user_metadata?.role as "creator" | "learner") ?? "learner");
    });
  }, []);

  useEffect(() => {
    if (role) {
      setStep(role === "creator" ? "creator-setup" : "learner-interests");
    }
  }, [role]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatorForm>({ resolver: zodResolver(creatorSchema) });

  async function finishCreatorOnboarding(data: CreatorForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = slugify(data.community_name);

    await supabase
      .from("users")
      .update({ role: "creator" })
      .eq("id", user.id);

    if (data.community_name) {
      await supabase.from("communities").insert({
        creator_id: user.id,
        name: data.community_name,
        slug,
        description: data.community_description ?? null,
        category: data.category,
        is_paid: false,
        price_uzs: 0,
      });
    }

    setStep("done");
    setTimeout(() => router.push("/creator"), 1500);
  }

  async function finishLearnerOnboarding() {
    setLoading(true);
    setTimeout(() => {
      setStep("done");
      setTimeout(() => router.push("/explore"), 1500);
    }, 500);
  }

  function toggleInterest(val: string) {
    setSelectedInterests((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  if (step === "done") {
    return (
      <FadeInUp>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="text-green-500" size={56} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t("done")}</h2>
          <p className="text-gray-500">{t("redirecting")}</p>
        </div>
      </FadeInUp>
    );
  }

  if (step === "creator-setup") {
    return (
      <FadeInUp>
        <div className="w-full max-w-lg">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("creatorTitle")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("creatorSubtitle")}</p>
            </div>

            <form onSubmit={handleSubmit(finishCreatorOnboarding)} className="space-y-4">
              <Input
                {...register("community_name")}
                label={t("communityName")}
                placeholder={t("communityNamePlaceholder")}
                error={errors.community_name?.message}
              />

              <Textarea
                {...register("community_description")}
                label={t("communityDescription")}
                placeholder={t("communityDescriptionPlaceholder")}
              />

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("category")}</label>
                <div className="flex flex-wrap gap-2">
                  {COMMUNITY_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue("category", cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-all",
                        watch("category") === cat
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {tc(cat)}
                    </button>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-xs text-red-600">{errors.category.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                {t("submitCreator")}
              </Button>
            </form>
          </div>
        </div>
      </FadeInUp>
    );
  }

  if (step === "learner-interests") {
    return (
      <FadeInUp>
        <div className="w-full max-w-lg">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("learnerTitle")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("learnerSubtitle")}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMUNITY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleInterest(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm border transition-all",
                    selectedInterests.includes(cat)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {tc(cat)}
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={finishLearnerOnboarding}
              loading={loading}
              disabled={selectedInterests.length === 0}
            >
              {t("submitLearner")}
            </Button>
          </div>
        </div>
      </FadeInUp>
    );
  }

  return null;
}
