
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallmentProjectionChart } from '@/components/transactions/InstallmentProjectionChart';
import { LineChart } from 'lucide-react';
import type { InstallmentProjection } from '@/types';
import { useTranslations } from '@/contexts/LanguageContext';

interface InstallmentProjectionCardProps {
    data: InstallmentProjection[];
}

export function InstallmentProjectionCard({ data }: InstallmentProjectionCardProps) {
    const { translations } = useTranslations();

    return (
        <div className="md:col-span-3">
            <Card className="shadow-xl border-2 border-primary h-full">
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-primary" />
                    {translations.installmentProjection}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <InstallmentProjectionChart data={data} />
                </CardContent>
            </Card>
        </div>
    );
}
