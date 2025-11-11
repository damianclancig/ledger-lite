
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpensesChart } from '@/components/transactions/ExpensesChart';
import { PieChart } from 'lucide-react';
import { useTranslations } from '@/contexts/LanguageContext';

interface ExpensesChartCardProps {
    expensesByCategory: {
        categoryId: string;
        name: string;
        isSystem: boolean;
        total: number;
    }[];
}

export function ExpensesChartCard({ expensesByCategory }: ExpensesChartCardProps) {
    const { translations } = useTranslations();
    
    return (
        <div className="md:col-span-1">
            <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary dark:text-accent" />
                {translations.expensesByCategory}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <ExpensesChart expensesByCategory={expensesByCategory} />
            </CardContent>
            </Card>
        </div>
    );
}
