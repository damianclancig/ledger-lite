
"use client";

import { useTranslations } from "@/contexts/LanguageContext";
import type { TransactionType } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TransactionTypeToggleProps {
  value: TransactionType | "all";
  onChange: (value: TransactionType | "all") => void;
}

export function TransactionTypeToggle({ value, onChange }: TransactionTypeToggleProps) {
  const { translations } = useTranslations();

  const options: { label: string; type: TransactionType; colorClass: string; activeColorClass: string }[] = [
    { 
      label: translations.income, 
      type: "income",
      colorClass: "bg-background border-input hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 border",
      activeColorClass: "bg-green-600 text-white hover:bg-green-700 border-transparent"
    },
    { 
      label: translations.expense, 
      type: "expense",
      colorClass: "bg-background border-input hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 border",
      activeColorClass: "bg-red-600 text-white hover:bg-red-700 border-transparent"
    },
  ];

  const handleClick = (type: TransactionType) => {
    if (value === type) {
      onChange("all");
    } else {
      onChange(type);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-1 rounded-md">
      {options.map((option) => (
        <Button
          key={option.type}
          variant="outline"
          onClick={() => handleClick(option.type)}
          className={cn(
            "w-full text-center cursor-pointer rounded-md p-2 text-base font-medium transition-colors h-10",
            value === option.type
              ? option.activeColorClass
              : option.colorClass
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
