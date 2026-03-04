import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format tiyins to UZS display string: 15000000 → "150 000 UZS" */
export function formatUZS(tiyins: number): string {
  const uzs = Math.round(tiyins / 100);
  return uzs.toLocaleString("ru-RU").replace(/,/g, " ") + " UZS";
}

/** Format tiyins to compact string: 150000000 → "1 500 000 UZS" */
export function formatUZSShort(tiyins: number): string {
  const uzs = Math.round(tiyins / 100);
  if (uzs >= 1_000_000) {
    return (uzs / 1_000_000).toFixed(1).replace(".", ",") + " млн UZS";
  }
  return formatUZS(tiyins);
}

/** Convert UZS to tiyins for storage */
export function uzsToTiyins(uzs: number): number {
  return Math.round(uzs * 100);
}

/** URL-safe community slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Relative time in Russian */
export function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "только что";
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffHour < 24) return `${diffHour} ч. назад`;
  if (diffDay < 7) return `${diffDay} д. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/** Calculate level from total points */
export function calcLevel(points: number): number {
  return Math.max(1, Math.floor(Math.sqrt(points / 100)));
}

/** Points needed for next level */
export function pointsForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel + 1, 2) * 100;
}

/** Get initials from name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
