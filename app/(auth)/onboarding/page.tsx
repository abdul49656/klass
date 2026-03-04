"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, slugify } from "@/lib/utils";
import { COMMUNITY_CATEGORIES } from "@/lib/types/database";
import { CheckCircle2 } from "lucide-react";

const creatorSchema = z.object({
  bio: z.string().max(200).optional(),
  community_name: z.string().min(3, "Минимум 3 символа").max(60),
  community_description: z.string().max(500).optional(),
  category: z.string().min(1, "Выберите категорию"),
});

const learnerSchema = z.object({
  interests: z.array(z.string()).min(1, "Выберите хотя бы 1 интерес"),
});

type CreatorForm = z.infer<typeof creatorSchema>;
type Step = "welcome" | "creator-setup" | "learner-interests" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<"creator" | "learner" | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

    // Update user record
    await supabase
      .from("users")
      .update({ role: "creator" })
      .eq("id", user.id);

    // Create community if name provided
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
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="text-green-500" size={56} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Готово!</h2>
        <p className="text-gray-500">Переходим к платформе…</p>
      </div>
    );
  }

  if (step === "creator-setup") {
    return (
      <div className="w-full max-w-lg">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Создайте своё сообщество</h1>
            <p className="text-sm text-gray-500 mt-1">Это можно изменить позже</p>
          </div>

          <form onSubmit={handleSubmit(finishCreatorOnboarding)} className="space-y-4">
            <Input
              {...register("community_name")}
              label="Название сообщества"
              placeholder="Например: Маркетинг с нуля"
              error={errors.community_name?.message}
            />

            <Textarea
              {...register("community_description")}
              label="Описание (необязательно)"
              placeholder="О чём ваше сообщество?"
            />

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Категория</label>
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setValue("category", cat.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-all",
                      watch("category") === cat.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Создать сообщество и продолжить
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "learner-interests") {
    return (
      <div className="w-full max-w-lg">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Выберите интересы</h1>
            <p className="text-sm text-gray-500 mt-1">Подберём подходящие сообщества</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {COMMUNITY_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleInterest(cat.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm border transition-all",
                  selectedInterests.includes(cat.value)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={finishLearnerOnboarding}
            loading={loading}
            disabled={selectedInterests.length === 0}
          >
            Перейти к обзору сообществ
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
