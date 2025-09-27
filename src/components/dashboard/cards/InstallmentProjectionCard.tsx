
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallmentProjectionChart } from '@/components/transactions/InstallmentProjectionChart';
import { LineChart, Search } from 'lucide-react';
import type { InstallmentProjection } from '@/types';
import { useTranslations } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InstallmentProjectionCardProps {
    data: InstallmentProjection[];
}

export function InstallmentProjectionCard({ data }: InstallmentProjectionCardProps) {
    const { translations } = useTranslations();

    return (
        <div className="md:col-span-3">
            <Card className="shadow-xl border-2 border-primary h-full">
                <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center">
                            <LineChart className="h-5 w-5 mr-2 text-primary dark:text-accent" />
                            {translations.installmentProjection}
                        </CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary dark:text-accent">
                                        <Link href="/installments">
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
                <CardContent className="p-4 pt-0">
                    <InstallmentProjectionChart data={data} />
                </CardContent>
            </Card>
        </div>
    );
}
