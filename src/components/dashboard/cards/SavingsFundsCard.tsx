
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SavingsFundsProgressChart } from '@/components/transactions/SavingsFundsProgressChart';
import { PiggyBank } from 'lucide-react';
import type { SavingsFund } from '@/types';
import { useTranslations } from '@/contexts/LanguageContext';

interface SavingsFundsCardProps {
    funds: SavingsFund[];
}

export function SavingsFundsCard({ funds }: SavingsFundsCardProps) {
    const { translations } = useTranslations();

    return (
        <div className="md:col-span-1">
            <Card className="shadow-xl border-2 border-primary h-full">
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center">
                    <PiggyBank className="h-5 w-5 mr-2 text-primary" />
                    {translations.savingsFunds}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 min-h-[100px]">
                    <SavingsFundsProgressChart funds={funds} />
                </CardContent>
            </Card>
        </div>
    );
}
