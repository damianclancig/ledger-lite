
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, Search } from 'lucide-react';
import { useTranslations } from '@/contexts/LanguageContext';
import type { SavingsFund } from '@/types';
import { SavingsFundsProgressChart } from '@/components/transactions/SavingsFundsProgressChart';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SavingsFundsCardProps {
    funds: SavingsFund[];
}

export function SavingsFundsCard({ funds }: SavingsFundsCardProps) {
    const { translations } = useTranslations();
    const fundsWithTarget = funds.filter(fund => fund.targetAmount > 0);

    return (
        <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                        <PiggyBank className="h-5 w-5 mr-2 text-primary dark:text-accent" />
                        {translations.savingsFunds}
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary dark:text-accent">
                                    <Link href="/savings-funds">
                                        <Search className="h-5 w-5" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{translations.seeDetails}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 h-full">
                {fundsWithTarget.length > 0 ? (
                    <SavingsFundsProgressChart funds={fundsWithTarget} />
                ) : (
                    <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-muted-foreground text-center p-4">
                        <PiggyBank className="w-10 h-10 mb-4" />
                        <p className="text-base font-semibold mb-2">{translations.noSavingsFundsProgressTitle}</p>
                        <p className="text-sm">
                            {translations.noSavingsFundsProgressDesc}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
