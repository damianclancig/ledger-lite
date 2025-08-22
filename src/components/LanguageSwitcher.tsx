
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
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, setLanguage, translations } = useTranslations();

  const onValueChange = (value: string) => {
    setLanguage(value as Language);
  };

  return (
    <Select value={language} onValueChange={onValueChange}>
      <SelectTrigger 
        className="w-10 h-10 p-0 border-2 border-primary" 
        aria-label={translations.selectLanguage}
        showArrow={false}
      >
        <LanguagesIcon className="h-5 w-5 mx-auto" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{translations.english}</SelectItem>
        <SelectItem value="es">{translations.spanish}</SelectItem>
        <SelectItem value="pt">{translations.portuguese}</SelectItem>
      </SelectContent>
    </Select>
  );
}
