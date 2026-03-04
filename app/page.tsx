import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  FadeInUp,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  FloatIn,
  CountUp,
} from "@/components/ui/motion";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ArrowRight, BookOpen, Users, Trophy, Zap, Quote } from "lucide-react";

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="h-14 border-b border-gray-100 flex items-center px-6 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">Klass</span>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">{t("nav.signup")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <FadeInUp>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium">
                <Zap size={14} />
                {t("hero.badge")}
              </div>
            </FadeInUp>
            <FadeInUp delay={0.1}>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                {t("hero.titleLine1")}
                <br />
                <span className="text-blue-600">{t("hero.titleLine2")}</span>
              </h1>
            </FadeInUp>
            <FadeInUp delay={0.2}>
              <p className="text-xl text-gray-500 max-w-2xl leading-relaxed">
                {t("hero.description")}
              </p>
            </FadeInUp>
            <FadeInUp delay={0.3}>
              <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {t("hero.ctaPrimary")}
                    <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/explore">{t("hero.ctaSecondary")}</Link>
                </Button>
              </div>
            </FadeInUp>
          </div>

          {/* Hero image */}
          <FloatIn delay={0.2} className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl -rotate-2" />
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&q=80"
                alt="Students collaborating"
                width={800}
                height={600}
                className="relative rounded-2xl shadow-xl object-cover"
                priority
              />
            </div>
          </FloatIn>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <CountUp
                value={t("socialProof.communities")}
                className="block text-3xl font-bold text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">{t("socialProof.communitiesLabel")}</p>
            </div>
            <div>
              <CountUp
                value={t("socialProof.learners")}
                className="block text-3xl font-bold text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">{t("socialProof.learnersLabel")}</p>
            </div>
            <div>
              <CountUp
                value={t("socialProof.lessons")}
                className="block text-3xl font-bold text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">{t("socialProof.lessonsLabel")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <FadeInUp>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t("howItWorks.heading")}
          </h2>
        </FadeInUp>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StaggerItem>
            <HowItWorksStep
              step={1}
              image="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=400&h=300&fit=crop&q=80"
              title={t("howItWorks.step1Title")}
              description={t("howItWorks.step1Description")}
            />
          </StaggerItem>
          <StaggerItem>
            <HowItWorksStep
              step={2}
              image="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop&q=80"
              title={t("howItWorks.step2Title")}
              description={t("howItWorks.step2Description")}
            />
          </StaggerItem>
          <StaggerItem>
            <HowItWorksStep
              step={3}
              image="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop&q=80"
              title={t("howItWorks.step3Title")}
              description={t("howItWorks.step3Description")}
            />
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInUp>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              {t("features.heading")}
            </h2>
          </FadeInUp>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerItem>
              <Feature
                icon={<Users className="text-blue-600" size={24} />}
                title={t("features.community.title")}
                description={t("features.community.description")}
              />
            </StaggerItem>
            <StaggerItem>
              <Feature
                icon={<BookOpen className="text-green-600" size={24} />}
                title={t("features.classroom.title")}
                description={t("features.classroom.description")}
              />
            </StaggerItem>
            <StaggerItem>
              <Feature
                icon={<Trophy className="text-amber-600" size={24} />}
                title={t("features.gamification.title")}
                description={t("features.gamification.description")}
              />
            </StaggerItem>
            <StaggerItem>
              <Feature
                icon={<Zap className="text-purple-600" size={24} />}
                title={t("features.monetization.title")}
                description={t("features.monetization.description")}
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <FadeInUp>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t("testimonials.heading")}
          </h2>
        </FadeInUp>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StaggerItem>
            <Testimonial
              quote={t("testimonials.t1.quote")}
              name={t("testimonials.t1.name")}
              role={t("testimonials.t1.role")}
              image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80"
            />
          </StaggerItem>
          <StaggerItem>
            <Testimonial
              quote={t("testimonials.t2.quote")}
              name={t("testimonials.t2.name")}
              role={t("testimonials.t2.role")}
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80"
            />
          </StaggerItem>
          <StaggerItem>
            <Testimonial
              quote={t("testimonials.t3.quote")}
              name={t("testimonials.t3.name")}
              role={t("testimonials.t3.role")}
              image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80"
            />
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-16">
        <FadeInUp>
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">
              {t("cta.heading")}
            </h2>
            <p className="text-gray-400">
              {t("cta.description")}
            </p>
            <Button size="lg" asChild className="bg-white! text-gray-900! hover:bg-gray-100!">
              <Link href="/signup">
                {t("cta.button")}
                <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </FadeInUp>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        {t("footer")}
      </footer>
    </div>
  );
}

function HowItWorksStep({
  step,
  image,
  title,
  description,
}: {
  step: number;
  image: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
          {step}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
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
    <div className="bg-white rounded-xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-2.5 bg-gray-50 rounded-lg w-fit">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  role,
  image,
}: {
  quote: string;
  name: string;
  role: string;
  image: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4 relative">
      <Quote size={24} className="text-blue-200" />
      <p className="text-sm text-gray-700 leading-relaxed italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Image
          src={image}
          alt={name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
