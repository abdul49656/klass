"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(50),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormData = z.infer<typeof schema>;
type Role = "learner" | "creator";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("learner");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Создать аккаунт</h1>
          <p className="text-sm text-gray-500">
            Присоединяйтесь к тысячам учеников и создателей
          </p>
        </div>

        {/* Role picker */}
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            selected={role === "learner"}
            onClick={() => setRole("learner")}
            icon={<GraduationCap size={24} />}
            title="Ученик"
            description="Вступайте в сообщества и учитесь"
          />
          <RoleCard
            selected={role === "creator"}
            onClick={() => setRole("creator")}
            icon={<BookOpen size={24} />}
            title="Создатель"
            description="Создавайте сообщество и зарабатывайте"
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("name")}
            label="Ваше имя"
            placeholder="Алишер Навоев"
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
            label="Пароль"
            type="password"
            placeholder="Минимум 6 символов"
            error={errors.password?.message}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Зарегистрироваться как {role === "creator" ? "создатель" : "ученик"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
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
