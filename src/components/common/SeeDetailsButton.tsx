"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { useTranslations } from '@/contexts/LanguageContext';

interface SeeDetailsButtonProps {
    href?: string;
    onClick?: () => void;
}

export function SeeDetailsButton({ href, onClick }: SeeDetailsButtonProps) {
    const { translations } = useTranslations();

    const buttonContent = (
        <Search className="h-5 w-5 text-primary group-hover:text-white" />
    );

    const buttonElement = href ? (
        <Button asChild variant="ghost" size="icon" className="group h-8 w-8">
            <Link href={href}>
                {buttonContent}
            </Link>
        </Button>
    ) : (
        <Button variant="ghost" size="icon" className="group h-8 w-8" onClick={onClick}>
            {buttonContent}
        </Button>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {buttonElement}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{translations.seeDetails}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
