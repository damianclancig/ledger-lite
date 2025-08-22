
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Language, Translations, Category, PaymentMethodType } from "@/types";
import { MONTHS } from "@/types";

import enTranslations from "@/locales/en.json";
import esTranslations from "@/locales/es.json";
import ptTranslations from "@/locales/pt.json";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
  translateCategory: (categoryName: string) => string;
  translatePaymentType: (paymentType: PaymentMethodType) => string;
  translateMonth: (monthIndex: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const availableTranslations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  es: esTranslations as Translations,
  pt: ptTranslations as Translations,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [translations, setTranslations] = useState<Translations>(availableTranslations.en);

  useEffect(() => {
    const storedLanguage = localStorage.getItem("ledgerLiteLanguage") as Language | null;
    if (storedLanguage && availableTranslations[storedLanguage]) {
      setLanguageState(storedLanguage);
      setTranslations(availableTranslations[storedLanguage]);
    } else {
      // Default to browser language if supported, else English
      const browserLang = navigator.language.split('-')[0] as Language;
      if (availableTranslations[browserLang]) {
        setLanguageState(browserLang);
        setTranslations(availableTranslations[browserLang]);
      } else {
        setLanguageState("en");
        setTranslations(availableTranslations.en);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    if (availableTranslations[lang]) {
      setLanguageState(lang);
      setTranslations(availableTranslations[lang]);
      localStorage.setItem("ledgerLiteLanguage", lang);
    }
  };
  
  const translateCategory = useCallback((categoryName: string): string => {
    const key = categoryName === "Other" ? "OtherCategory" : categoryName;
    return translations[key as keyof Translations] || categoryName;
  }, [translations]);

  const translatePaymentType = useCallback((paymentType: PaymentMethodType): string => {
     const key = paymentType.replace(/\s/g, '');
     if (key === "Other") return translations.OtherPaymentType;
     return translations[key as keyof Translations] || paymentType;
  }, [translations]);
  
  const translateMonth = useCallback((monthIndex: number): string => {
    const monthName = MONTHS[monthIndex];
    return translations[monthName as keyof Translations] || monthName;
  }, [translations]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, translateCategory, translatePaymentType, translateMonth }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslations = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslations must be used within a LanguageProvider");
  }
  return context;
};
