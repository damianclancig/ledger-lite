
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/LanguageContext";
import { getCardSummaries, payCardSummary } from "@/app/actions/cardSummaryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import type { CardSummary, PaymentMethod, Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Banknote, Calendar, Info, DollarSign, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es, pt, enUS } from 'date-fns/locale';
import { IntroAccordion } from "@/components/common/IntroAccordion";
import { PayCardSummaryDialog } from "./_components/PayCardSummaryDialog";
import { useToast } from "@/hooks/use-toast";

export default function CardSummariesPage() {
    const { user } = useAuth();
    const { translations, language } = useTranslations();
    const { toast } = useToast();
    
    const [summaries, setSummaries] = useState<CardSummary[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<CardSummary | null>(null);

    const locales = { en: enUS, es, pt };
    const currentLocale = locales[language] || enUS;

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [fetchedSummaries, fetchedPaymentMethods] = await Promise.all([
                getCardSummaries(user.uid),
                getPaymentMethods(user.uid),
            ]);
            setSummaries(fetchedSummaries);
            // Filter out credit cards as payment methods for the summary
            setPaymentMethods(fetchedPaymentMethods.filter(pm => pm.type !== 'Credit Card'));
        } catch (error) {
            console.error("Failed to load card summaries:", error);
            toast({ title: translations.errorTitle, description: "Failed to load card summaries data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        loadData();
    }, [user, toast, translations]);

    const handleOpenPayDialog = (summary: CardSummary) => {
        setSelectedSummary(summary);
        setDialogOpen(true);
    };

    const handlePaySummary = async (values: { amount: number; paymentMethodId: string; date: Date }) => {
        if (!user || !selectedSummary) return;

        const description = translations.paymentForCardSummary.replace('{cardName}', selectedSummary.cardName);

        const result = await payCardSummary(user.uid, selectedSummary.cardId, values.amount, values.date, values.paymentMethodId, description);
        
        if (result.success) {
            toast({ title: translations.summaryPaymentSuccess });
            setDialogOpen(false);
            setSelectedSummary(null);
            loadData(); // Re-fetch data to update the view
        } else {
            toast({ title: translations.summaryPaymentError, description: result.error, variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center mb-8">
                    <Skeleton className="h-8 w-8 mr-3" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <CreditCard className="h-8 w-8 mr-3 text-primary" />
                <h1 className="text-3xl font-bold">{translations.cardSummaries}</h1>
            </div>

            <IntroAccordion
                titleKey="cardSummariesIntroTitle"
                contentKeys={["cardSummariesIntroText1", "cardSummariesIntroText2", "cardSummariesIntroText3"]}
                storageKey="cardSummariesIntroVisible"
            />

            {summaries.length === 0 ? (
                <Card className="shadow-xl border-2 border-primary/20">
                    <CardContent className="text-center py-10 px-6 text-muted-foreground">
                        <CreditCard className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-lg">{translations.noCardSummaries}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {summaries.map(summary => (
                        <Card key={summary.cardId} className="shadow-xl border-2 border-primary/20">
                           <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div className="flex items-center">
                                        <Wallet className="h-6 w-6 sm:h-7 sm:w-7 mr-3 text-primary" />
                                        <div>
                                            <CardTitle className="text-base sm:text-xl">
                                                {summary.cardName}
                                            </CardTitle>
                                            {summary.cardBank && <p className="text-xs sm:text-sm text-muted-foreground">{summary.cardBank}</p>}
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto pt-2 sm:pt-0 text-right">
                                        <p className="text-xs sm:text-sm text-muted-foreground">{translations.totalAmount}</p>
                                        <p className="text-lg sm:text-2xl font-bold font-mono text-red-500">{formatCurrency(summary.totalAmount)}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="details">
                                        <AccordionTrigger>
                                            <div className="flex items-center text-sm sm:text-base">
                                                <Info className="h-4 w-4 mr-2" /> {translations.unpaidExpenses} ({summary.transactions.length})
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-2 pt-2">
                                                {summary.transactions.map(tx => (
                                                    <li key={tx.id} className="flex justify-between items-center text-sm sm:text-base border-b pb-1">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{tx.description}</p>
                                                            <p className="text-xs sm:text-sm text-muted-foreground">{format(new Date(tx.date), "PPP", { locale: currentLocale })}</p>
                                                        </div>
                                                        <p className="font-mono">{formatCurrency(tx.amount)}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full text-base sm:text-lg" onClick={() => handleOpenPayDialog(summary)}>
                                    <DollarSign className="h-5 w-5 mr-2"/> {translations.paySummary}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {selectedSummary && (
                <PayCardSummaryDialog
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    summary={selectedSummary}
                    paymentMethods={paymentMethods}
                    onConfirm={handlePaySummary}
                />
            )}
        </div>
    );
}
