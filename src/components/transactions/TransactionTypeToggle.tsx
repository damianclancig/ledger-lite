"use client";

import { useTranslations } from "@/contexts/LanguageContext";
import type { TransactionType } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
interface TransactionTypeToggleProps {
  value: TransactionType | "all" | "savings";
  onChange: (value: TransactionType | "all" | "savings") => void;
}

type FilterType = "income" | "expense" | "savings";

export function TransactionTypeToggle({ value, onChange }: TransactionTypeToggleProps) {
  const { translations } = useTranslations();

  const options: { label: string; value: FilterType; colorClass: string; activeColorClass: string }[] = [
    {
      label: translations.income,
      value: "income",
      colorClass: "bg-background border-input hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 border",
      activeColorClass: "bg-green-600 text-white hover:bg-green-700 border-transparent"
    },
    {
      label: translations.expense,
      value: "expense",
      colorClass: "bg-background border-input hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 border",
      activeColorClass: "bg-red-600 text-white hover:bg-red-700 border-transparent"
    },
    {
      label: translations.Savings,
      value: "savings",
      colorClass: "bg-background border-input hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border",
      activeColorClass: "bg-blue-600 text-white hover:bg-blue-700 border-transparent"
    },
  ];

  const isActive = (type: FilterType) => {
    return value === type;
  }

  const handleClick = (type: FilterType) => {
    const currentlyActive = isActive(type);
    if (currentlyActive) {
      onChange("all");
    } else {
      onChange(type);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-1 rounded-md">
      {options.map((option) => (
        <Button
          key={option.value}
          variant="outline"
          onClick={() => handleClick(option.value)}
          className={cn(
            "w-full text-center cursor-pointer rounded-md p-2 text-base font-medium transition-colors h-10 flex items-center justify-center gap-2",
            isActive(option.value)
              ? option.activeColorClass
              : option.colorClass
          )}
        >
          <span>{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
