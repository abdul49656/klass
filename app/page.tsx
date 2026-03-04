import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Trophy, Zap } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/explore");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="h-14 border-b border-gray-100 flex items-center px-6 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">Klass</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Начать бесплатно</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium">
          <Zap size={14} />
          Платформа для обучающих сообществ в Узбекистане
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
          Создай своё
          <br />
          <span className="text-blue-600">сообщество</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Klass — это платформа, где эксперты создают платные обучающие сообщества,
          а ученики учатся, общаются и растут вместе.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button size="lg" asChild>
            <Link href="/signup">
              Начать бесплатно
              <ArrowRight size={18} />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/explore">Смотреть сообщества</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Всё необходимое в одном месте
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Feature
            icon={<Users className="text-blue-600" size={24} />}
            title="Сообщество"
            description="Живая лента, комментарии, закреплённые посты и общение с участниками"
          />
          <Feature
            icon={<BookOpen className="text-green-600" size={24} />}
            title="Классная комната"
            description="Курсы с модулями и уроками, видеоуроки YouTube/Vimeo, отслеживание прогресса"
          />
          <Feature
            icon={<Trophy className="text-amber-600" size={24} />}
            title="Геймификация"
            description="Очки за активность, уровни, таблица лидеров — мотивируй участников учиться"
          />
          <Feature
            icon={<Zap className="text-purple-600" size={24} />}
            title="Монетизация"
            description="Платный доступ к сообществу, автоматические еженедельные выплаты на карту"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Готовы начать?
          </h2>
          <p className="text-gray-400">
            Создайте своё первое сообщество за несколько минут.
            Бесплатно навсегда для начинающих.
          </p>
          <Button size="lg" asChild className="bg-white! text-gray-900! hover:bg-gray-100!">
            <Link href="/signup">
              Зарегистрироваться
              <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        © 2025 Klass. Все права защищены.
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-3">
      <div className="p-2.5 bg-white rounded-lg w-fit shadow-sm">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
