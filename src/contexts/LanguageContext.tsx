
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Language, Translations, Category, PaymentMethodType } from "@/types";
import { MONTHS } from "@/types";

import enTranslations from "@/locales/en.json";
import esTranslations from "@/locales/es.json";
import ptTranslations from "@/locales/pt.json";

interface LanguageContextType {
  language: Language;
  loading: boolean;
  setLanguage: (language: Language) => void;
  translations: Translations;
  translateCategory: (category: Category) => string;
  translatePaymentType: (paymentType: PaymentMethodType) => string;
  translateMonth: (monthIndex: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const availableTranslations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  es: esTranslations as Translations,
  pt: ptTranslations as Translations,
};

const getInitialLanguage = (): Language => {
    if (typeof window === 'undefined') {
        return 'en'; // Default language for server-side rendering
    }
    const storedLanguage = localStorage.getItem("ledgerLiteLanguage") as Language | null;
    if (storedLanguage && availableTranslations[storedLanguage]) {
        return storedLanguage;
    }
    const browserLang = navigator.language.split('-')[0] as Language;
    if (availableTranslations[browserLang]) {
        return browserLang;
    }
    return 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage);
    const [loading, setLoading] = useState(false); // Can be used for async loading in the future

    const setLanguage = (lang: Language) => {
        if (availableTranslations[lang]) {
            setLanguageState(lang);
            localStorage.setItem("ledgerLiteLanguage", lang);
        }
    };
    
    const translations = useMemo(() => availableTranslations[language], [language]);

    const translateCategory = useCallback((category: Category): string => {
        if (category.isSystem) {
        return translations[category.name as keyof Translations] || category.name;
        }
        return category.name;
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
        <LanguageContext.Provider value={{ language, loading, setLanguage, translations, translateCategory, translatePaymentType, translateMonth }}>
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
