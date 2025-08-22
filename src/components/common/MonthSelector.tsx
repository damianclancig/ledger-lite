
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, subMonths, isSameMonth } from "date-fns";
import { useTranslations } from "@/contexts/LanguageContext";
import { es, pt, enUS } from 'date-fns/locale';

interface MonthSelectorProps {
  selectedMonth: Date | null;
  onSelectMonth: (month: Date | null) => void;
}

export function MonthSelector({ selectedMonth, onSelectMonth }: MonthSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { language, translations } = useTranslations();
  const [showGradient, setShowGradient] = useState(false);
  const monthRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const locales = { en: enUS, es, pt };
  const currentLocale = locales[language] || enUS;
  
  const months = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i));

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const handleScroll = () => {
        const isAtStart = container.scrollLeft === 0;
        setShowGradient(!isAtStart);
      };

      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); 

      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      const selectedMonthKey = selectedMonth.toISOString();
      const monthButton = monthRefs.current.get(selectedMonthKey);
      if (monthButton) {
        monthButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
            left: 0,
            behavior: "smooth",
        })
    }
  }, [selectedMonth]);

  return (
    <div className="relative">
       {showGradient && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      )}
      <div 
        ref={scrollContainerRef} 
        className="flex space-x-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide"
      >
        {months.map((month) => {
           const monthKey = month.toISOString();
           return (
              <Button
                key={monthKey}
                ref={(el) => monthRefs.current.set(monthKey, el)}
                variant={selectedMonth && isSameMonth(month, selectedMonth) ? "default" : "outline"}
                onClick={() => onSelectMonth(month)}
                className="capitalize shrink-0"
              >
                {format(month, "MMMM yyyy", { locale: currentLocale })}
              </Button>
            )
        })}
        <Button
          variant={selectedMonth === null ? "default" : "outline"}
          onClick={() => onSelectMonth(null)}
          className="capitalize shrink-0"
        >
          {translations.allMonths}
        </Button>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
