"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const LOCALES = ["ru", "en"] as const;

export function LanguageToggle() {
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations("LanguageToggle");

  function switchLocale(locale: string) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors outline-none cursor-pointer"
          aria-label="Change language"
        >
          <Globe size={16} />
          <span className="hidden sm:inline uppercase text-xs font-medium">
            {currentLocale}
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-36 bg-white border border-gray-100 rounded-xl shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
          sideOffset={8}
          align="end"
        >
          {LOCALES.map((locale) => (
            <DropdownMenu.Item
              key={locale}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors",
                locale === currentLocale
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              )}
              onSelect={() => switchLocale(locale)}
            >
              <span className="text-base">{locale === "ru" ? "🇷🇺" : "🇬🇧"}</span>
              {t(locale)}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
