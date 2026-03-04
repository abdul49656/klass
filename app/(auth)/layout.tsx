import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Auth");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple header */}
      <header className="h-14 flex items-center px-6">
        <Link href="/" className="font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors">
          Klass
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        {t("footer")}
      </footer>
    </div>
  );
}
