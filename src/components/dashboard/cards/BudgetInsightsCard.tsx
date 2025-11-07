
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, TrendingDown, CalendarDays, Wallet, ReceiptText, Banknote, History } from 'lucide-react';
import { useTranslations } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import type { BudgetInsights } from '@/types';
import { Separator } from '@/components/ui/separator';

interface BudgetInsightsCardProps {
    insights: BudgetInsights;
}

interface InsightItemProps {
    icon: React.ElementType;
    label: string;
    value: string;
    description?: string;
    iconColor?: string;
    isSubItem?: boolean;
}

const InsightItem: React.FC<InsightItemProps> = ({ icon: Icon, label, value, description, iconColor, isSubItem = false }) => (
    <div className={`flex items-start ${isSubItem ? 'space-x-3' : 'space-x-4'}`}>
        <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${iconColor || 'text-primary'}`} />
        </div>
        <div className="flex-1">
            <p className={`font-medium ${isSubItem ? 'text-sm' : 'text-base'}`}>{label}</p>
            <p className={`font-bold font-mono ${isSubItem ? 'text-base' : 'text-lg'}`}>{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
    </div>
);

export function BudgetInsightsCard({ insights }: BudgetInsightsCardProps) {
    const { translations } = useTranslations();
    
    const historicView = (
      <>
        <div>
            <h4 className="mb-2 font-semibold flex items-center"><History className="mr-2 h-4 w-4" /> {translations.historicCycleData}</h4>
            <div className="pl-6 space-y-2">
                <InsightItem
                    icon={TrendingDown}
                    label={translations.avgDailyExpenseCycle}
                    value={formatCurrency(insights.cycleDailyAverage || 0)}
                    iconColor="text-red-500"
                    isSubItem
                />
                <InsightItem
                    icon={Banknote}
                    label={translations.avgWeeklyExpenseCycle}
                    value={formatCurrency(insights.cycleWeeklyAverage || 0)}
                    iconColor="text-red-500"
                    isSubItem
                />
            </div>
        </div>
      </>
    );

    const projectionView = (
       <>
         <div>
            <h4 className="mb-2 font-semibold flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> {translations.dailyView}</h4>
            <div className="pl-6 space-y-2">
                  <InsightItem
                    icon={TrendingDown}
                    label={translations.avgDailyExpense}
                    value={formatCurrency(insights.dailyAverage7Days)}
                    iconColor="text-red-500"
                    isSubItem
                />
                <InsightItem
                    icon={Wallet}
                    label={translations.dailyBudget}
                    value={formatCurrency(insights.dailyBudget)}
                    iconColor="text-green-500"
                    isSubItem
                />
            </div>
        </div>
        
        <Separator />
        
        <div>
            <h4 className="mb-2 font-semibold flex items-center"><ReceiptText className="mr-2 h-4 w-4" /> {translations.weeklyView}</h4>
            <div className="pl-6 space-y-2">
                <InsightItem
                    icon={Banknote}
                    label={translations.weeklyExpenses}
                    value={formatCurrency(insights.weeklyExpensesTotal)}
                    iconColor="text-red-500"
                    isSubItem
                />
                <InsightItem
                    icon={Wallet}
                    label={translations.weeklyBudget}
                    value={formatCurrency(insights.weeklyBudget)}
                    iconColor="text-green-500"
                    isSubItem
                />
            </div>
        </div>
       </>
    );

    return (
        <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary dark:text-accent" />
                    {translations.budgetInsights}
                </CardTitle>
                <CardDescription>
                    {insights.isHistoric ? translations.historicCycleInfo : translations.budgetInsightsDescription}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                   {insights.isHistoric ? historicView : projectionView}
                </div>
            </CardContent>
        </Card>
    );
}
