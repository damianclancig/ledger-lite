
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';
import { useTranslations } from '@/contexts/LanguageContext';
import { SeeDetailsButton } from '@/components/common/SeeDetailsButton';
import { DailyExpensesChart, type DailyExpensesData } from '@/components/transactions/DailyExpensesChart';

interface DailyExpensesCardProps {
    data: DailyExpensesData[];
    onSeeDetails: () => void;
}

export function DailyExpensesCard({ data, onSeeDetails }: DailyExpensesCardProps) {
    const { translations } = useTranslations();

    return (
        <div className="md:col-span-1">
            <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                        <LineChart className="h-5 w-5 mr-2 text-primary dark:text-accent" />
                        {translations.dailyExpenses}
                    </CardTitle>
                    <SeeDetailsButton onClick={onSeeDetails} />
                 </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <DailyExpensesChart chartData={data} />
            </CardContent>
            </Card>
        </div>
    );
}
