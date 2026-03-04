"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeInUp } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap } from "lucide-react";

type Role = "learner" | "creator";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("learner");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const t = useTranslations("Auth.signup");
  const tv = useTranslations("Validation");

  const schema = z.object({
    name: z.string().min(2, tv("nameMin")).max(50),
    email: z.string().email(tv("emailInvalid")),
    password: z.string().min(6, tv("passwordMin")),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, role },
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/onboarding");
  }

  return (
    <FadeInUp>
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              selected={role === "learner"}
              onClick={() => setRole("learner")}
              icon={<GraduationCap size={24} />}
              title={t("learner.title")}
              description={t("learner.description")}
            />
            <RoleCard
              selected={role === "creator"}
              onClick={() => setRole("creator")}
              icon={<BookOpen size={24} />}
              title={t("creator.title")}
              description={t("creator.description")}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("name")}
              label={t("name")}
              placeholder={t("namePlaceholder")}
              error={errors.name?.message}
              autoComplete="name"
            />
            <Input
              {...register("email")}
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              autoComplete="email"
            />
            <Input
              {...register("password")}
              label={t("password")}
              type="password"
              placeholder={t("passwordPlaceholder")}
              error={errors.password?.message}
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              {role === "creator" ? t("submitCreator") : t("submitLearner")}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </FadeInUp>
  );
}

function RoleCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 text-left transition-all",
        selected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      )}
    >
      <div className={cn("mb-2", selected ? "text-blue-600" : "text-gray-500")}>
        {icon}
      </div>
      <p className={cn("font-semibold text-sm", selected ? "text-blue-700" : "text-gray-800")}>
        {title}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </button>
  );
}
