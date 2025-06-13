
"use client";

import { useTranslations } from "@/contexts/LanguageContext";
import type { Language } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguagesIcon } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage, translations } = useTranslations();

  const onValueChange = (value: string) => {
    setLanguage(value as Language);
  };

  return (
    <Select value={language} onValueChange={onValueChange}>
      <SelectTrigger className="w-auto border-2 border-primary" aria-label={translations.selectLanguage}>
        <LanguagesIcon className="mr-2 h-4 w-4" />
        <SelectValue placeholder={translations.selectLanguage} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{translations.english}</SelectItem>
        <SelectItem value="es">{translations.spanish}</SelectItem>
        <SelectItem value="pt">{translations.portuguese}</SelectItem>
      </SelectContent>
    </Select>
  );
}
