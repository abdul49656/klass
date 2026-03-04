import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        primary: "bg-blue-100 text-blue-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-yellow-100 text-yellow-700",
        danger: "bg-red-100 text-red-700",
        level1: "bg-gray-100 text-gray-600",
        level2: "bg-green-100 text-green-700",
        level3: "bg-blue-100 text-blue-700",
        level4: "bg-purple-100 text-purple-700",
        level5: "bg-yellow-100 text-yellow-700",
        level6: "bg-orange-100 text-orange-700",
        level7: "bg-red-100 text-red-700",
        level8: "bg-pink-100 text-pink-700",
        level9: "bg-indigo-100 text-indigo-700",
        level10: "bg-amber-100 text-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function LevelBadge({ level, label }: { level: number; label?: string }) {
  const clampedLevel = Math.min(10, Math.max(1, level)) as
    | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  const variantMap: Record<typeof clampedLevel, BadgeProps["variant"]> = {
    1: "level1", 2: "level2", 3: "level3", 4: "level4", 5: "level5",
    6: "level6", 7: "level7", 8: "level8", 9: "level9", 10: "level10",
  };
  return (
    <Badge variant={variantMap[clampedLevel]}>
      {label ?? `Level ${clampedLevel}`}
    </Badge>
  );
}

export { Badge, badgeVariants };
