
"use client";

import * as React from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import type { SavingsFund } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { PiggyBank, Star, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cva, type VariantProps } from "class-variance-authority";

const progressVariants = cva(
    "",
    {
        variants: {
            size: {
                default: "text-base",
                sm: "text-sm"
            },
        },
        defaultVariants: {
            size: "default",
        },
    }
);

interface SavingsFundProgressProps extends VariantProps<typeof progressVariants> {
  fund: Pick<SavingsFund, "name" | "currentAmount" | "targetAmount">;
}

export function SavingsFundProgress({ fund, size }: SavingsFundProgressProps) {
  const { translations } = useTranslations();
  
  if (fund.targetAmount <= 0) return null;

  const progress = (fund.currentAmount / fund.targetAmount) * 100;
  const isCompleted = fund.currentAmount >= fund.targetAmount;
  const isApproachingGoal = progress >= 80 && !isCompleted;
  
  const percentage = Math.min(100, progress);
  const ariaLabel = `${translations.progress} ${translations.for} ${fund.name}: ${percentage.toFixed(0)}%`;

  return (
    <div className={cn(progressVariants({ size }))}>
        <div className="flex justify-between items-center mb-1">
            <span className="font-medium truncate pr-2">{fund.name}</span>
            <span className="font-medium text-muted-foreground">{percentage.toFixed(0)}%</span>
        </div>
        <Progress 
            value={percentage} 
            aria-label={ariaLabel}
            className="h-3 relative overflow-hidden"
            indicatorClassName={cn({
                "bg-green-600 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent after:animate-shimmer": isCompleted,
                "[--bg-color-from:hsl(var(--primary))] [--bg-color-to:hsl(223,63%,35%)] bg-[repeating-linear-gradient(135deg,var(--bg-color-from),var(--bg-color-from)_10px,var(--bg-color-to)_10px,var(--bg-color-to)_20px)] bg-[length:200%_200%] animate-approaching-goal": isApproachingGoal,
            })}
        />
        <div className={cn("mt-1 text-xs font-mono", size === 'default' && "text-sm")}>
            {isCompleted ? (
            <div className="flex items-center justify-center gap-2 font-semibold text-green-600">
                <CheckCircle2 className={cn("h-4 w-4", size === 'default' && "h-5 w-5")} />
                <span>{translations.completed}: {formatCurrency(fund.targetAmount)}</span>
            </div>
            ) : (
            <div className="flex justify-between items-start">
                <span>{formatCurrency(fund.currentAmount)}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  <span className="text-muted-foreground">{formatCurrency(fund.targetAmount)}</span>
                </div>
            </div>
            )}
        </div>
    </div>
  );
}
