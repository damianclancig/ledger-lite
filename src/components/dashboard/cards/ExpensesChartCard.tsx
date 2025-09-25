
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpensesChart } from '@/components/transactions/ExpensesChart';
import { PieChart } from 'lucide-react';
import type { Transaction, Category } from '@/types';
import { useTranslations } from '@/contexts/LanguageContext';

interface ExpensesChartCardProps {
    transactions: Transaction[];
    categories: Category[];
}

export function ExpensesChartCard({ transactions, categories }: ExpensesChartCardProps) {
    const { translations } = useTranslations();
    
    const categoryIdToCategoryMap = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat;
            return acc;
        }, {} as Record<string, Category>);
    }, [categories]);

    return (
        <div className="md:col-span-1">
            <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                {translations.expensesByCategory}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <ExpensesChart transactions={transactions} categoryIdToCategoryMap={categoryIdToCategoryMap} />
            </CardContent>
            </Card>
        </div>
    );
}
