"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { cn } from "@/lib/utils";
import {
  Compass,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { User as UserType } from "@/lib/types/database";

interface NavbarProps {
  user: UserType | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Navbar");

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href={user ? "/explore" : "/"}
          className="font-bold text-xl text-gray-900 tracking-tight hover:text-blue-600 transition-colors"
        >
          Klass
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/explore" active={pathname === "/explore"}>
            <Compass size={16} />
            {t("explore")}
          </NavLink>
          {user?.role === "creator" && (
            <NavLink
              href="/creator"
              active={pathname.startsWith("/creator")}
            >
              <LayoutDashboard size={16} />
              {t("dashboard")}
            </NavLink>
          )}
          {user?.role === "learner" && (
            <NavLink
              href="/learner"
              active={pathname.startsWith("/learner")}
            >
              <LayoutDashboard size={16} />
              {t("myCourses")}
            </NavLink>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="outline-none cursor-pointer">
                  <UserAvatar
                    name={user.name}
                    avatarUrl={user.avatar_url}
                    size="sm"
                  />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-48 bg-white border border-gray-100 rounded-xl shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
                  sideOffset={8}
                  align="end"
                >
                  <div className="px-3 py-2 border-b border-gray-50 mb-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownItem href="/profile">
                    <User size={14} />
                    {t("profile")}
                  </DropdownItem>
                  <DropdownItem href="/settings">
                    <Settings size={14} />
                    {t("settings")}
                  </DropdownItem>
                  <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 cursor-pointer outline-none"
                    onSelect={handleSignOut}
                  >
                    <LogOut size={14} />
                    {t("signOut")}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t("signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {children}
    </Link>
  );
}

function DropdownItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer outline-none"
      >
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
