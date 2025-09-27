
"use client";

import type { Transaction, TransactionType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface TotalsDisplayProps {
  transactions: Transaction[];
  onSetSelectedType: (type: TransactionType | "all") => void;
}

export function TotalsDisplay({ transactions, onSetSelectedType }: TotalsDisplayProps) {
  const { translations } = useTranslations();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const handleFilterClick = (type: TransactionType) => {
    onSetSelectedType(type);
    const filterCard = document.querySelector('[data-testid="filters-card"]');
    filterCard?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium flex items-center">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            {translations.totalIncome}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary dark:text-accent" onClick={() => handleFilterClick('income')}>
                        <Search className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{translations.seeDetails}</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-center text-green-600 dark:text-green-400 font-mono">
            {formatCurrency(totalIncome)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium flex items-center">
            <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
            {translations.totalExpenses}
          </CardTitle>
           <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary dark:text-accent" onClick={() => handleFilterClick('expense')}>
                        <Search className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{translations.seeDetails}</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-center text-red-600 dark:text-red-400 font-mono">
            {formatCurrency(totalExpenses)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium flex items-center">
             <DollarSign className={`h-5 w-5 mr-2 ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
             Balance
          </CardTitle>
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
