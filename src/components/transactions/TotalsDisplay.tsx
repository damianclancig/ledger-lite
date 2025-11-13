"use client";

import type { TransactionType } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SeeDetailsButton } from '@/components/common/SeeDetailsButton';

interface TotalsDisplayProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  onSetSelectedType: (type: TransactionType | "all") => void;
}

export function TotalsDisplay({ totalIncome, totalExpenses, balance, onSetSelectedType }: TotalsDisplayProps) {
  const { translations } = useTranslations();

  const handleFilterClick = (type: TransactionType) => {
    onSetSelectedType(type);
    const filterCard = document.querySelector('[data-testid="filters-card"]');
    filterCard?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="font-medium flex items-center text-xl">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            {translations.totalIncome}
          </div>
          <SeeDetailsButton onClick={() => handleFilterClick('income')} />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-center text-green-600 dark:text-green-400 font-mono">
            {formatCurrency(totalIncome)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="font-medium flex items-center text-xl">
            <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
            {translations.totalExpenses}
          </div>
           <SeeDetailsButton onClick={() => handleFilterClick('expense')} />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-center text-red-600 dark:text-red-400 font-mono">
            {formatCurrency(totalExpenses)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="font-medium flex items-center text-xl">
             <DollarSign className={`h-5 w-5 mr-2 ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
             Balance
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-xl md:text-2xl font-bold text-center ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'} font-mono`}>
            {formatCurrency(balance)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
