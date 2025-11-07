
"use client";

import React, { useMemo, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionTypeToggle } from '@/components/transactions/TransactionTypeToggle';
import { Filter, CalendarIcon, Search, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es, pt, enUS } from "date-fns/locale";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from '@/contexts/LanguageContext';
import type { Category, TransactionType, DateRange } from '@/types';

interface FiltersCardProps {
  categories: Category[];
  dateRange: DateRange | undefined;
  searchTerm: string;
  selectedCategory: string | 'all';
  selectedType: TransactionType | 'all';
  onDateChange: (range: DateRange | undefined) => void;
  onSearchTermChange: (term: string) => void;
  onSelectedCategoryChange: (category: string | 'all') => void;
  onSelectedTypeChange: (type: TransactionType | 'all') => void;
  onClearFilters: () => void;
  isAnyFilterActive: boolean;
  currentCycleStartDate?: Date;
}

export const FiltersCard = forwardRef<HTMLDivElement, FiltersCardProps>(({
  categories,
  dateRange,
  searchTerm,
  selectedCategory,
  selectedType,
  onDateChange,
  onSearchTermChange,
  onSelectedCategoryChange,
  onSelectedTypeChange,
  onClearFilters,
  isAnyFilterActive,
  currentCycleStartDate,
}, ref) => {
  const { translations, language, translateCategory } = useTranslations();
  const isMobile = useIsMobile();
  
  const locales = { en: enUS, es, pt };
  const currentLocale = locales[language] || enUS;
  
  const getCategoryDisplay = (cat: Category) => {
    if (cat.isSystem && cat.name === "Taxes" && language !== "en") {
      return `Taxes (${translateCategory(cat)})`;
    }
    return translateCategory(cat);
  };

  return (
    <div ref={ref} className="scroll-mt-24" data-testid="filters-card">
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="p-4">
          <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center mb-2 md:mb-0">
              <Filter className="h-5 w-5 mr-2 text-primary dark:text-accent" />
              {translations.transactions}
            </CardTitle>
            <Button
              variant="link"
              onClick={onClearFilters}
              className={cn(
                "hidden md:flex text-base text-muted-foreground hover:text-primary p-0 h-auto justify-start transition-opacity duration-300",
                isAnyFilterActive ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              aria-hidden={!isAnyFilterActive}
            >
              <XCircle className="mr-2 h-4 w-4" />
              <span className="mr-2">{translations.clearFilters}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={translations.searchDescription}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <TransactionTypeToggle
            value={selectedType}
            onChange={(value) => onSelectedTypeChange(value as TransactionType | "all")}
          />
          <Select
            value={selectedCategory}
            onValueChange={(value: string) => onSelectedCategoryChange(value as string | "all")}
          >
            <SelectTrigger className="text-base">
              <SelectValue placeholder={translations.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translations.allCategories}</SelectItem>
              {categories.filter(c => c.isEnabled).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {getCategoryDisplay(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal text-base h-10 pl-10",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP", { locale: currentLocale })} -{" "}
                        {format(dateRange.to, "PPP", { locale: currentLocale })}
                      </>
                    ) : (
                      format(dateRange.from, "PP", { locale: currentLocale })
                    )
                  ) : (
                    <span>{translations.dateRange}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  locale={currentLocale}
                  month={currentCycleStartDate}
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          {isMobile && isAnyFilterActive && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="w-full md:hidden"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {translations.clearFilters}
              </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
});

FiltersCard.displayName = "FiltersCard";
