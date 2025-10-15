
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallmentProjectionChart } from '@/components/transactions/InstallmentProjectionChart';
import { TrendingDown } from 'lucide-react';
import type { InstallmentProjection } from '@/types';
import { useTranslations } from '@/contexts/LanguageContext';
import { SeeDetailsButton } from '@/components/common/SeeDetailsButton';

interface InstallmentProjectionCardProps {
    data: InstallmentProjection[];
}

export function InstallmentProjectionCard({ data }: InstallmentProjectionCardProps) {
    const { translations } = useTranslations();

    return (
        <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                        <TrendingDown className="h-5 w-5 mr-2 text-primary dark:text-accent" />
                        {translations.installmentProjection}
                    </CardTitle>
                    <SeeDetailsButton href="/installments" />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <InstallmentProjectionChart data={data} />
            </CardContent>
        </Card>
    );
}
