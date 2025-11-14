
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es, pt, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTranslations } from "@/contexts/LanguageContext";
import { formatCurrency, formatNumberForDisplay, cn } from "@/lib/utils";
import type { CardSummary, PaymentMethod, Translations } from "@/types";
import { CalendarIcon, DollarSign } from 'lucide-react';

interface PayCardSummaryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    summary: CardSummary;
    paymentMethods: PaymentMethod[];
    onConfirm: (values: { amount: number; paymentMethodId: string; date: Date }) => void;
}

const getFormSchema = (translations: Translations, maxAmount: number) => z.object({
  amount: z.coerce
    .number({ required_error: translations.amountRequired })
    .positive({ message: translations.amountPositive })
    .max(maxAmount, { message: `${translations.amountToPay} ${formatCurrency(maxAmount)}` }),
  paymentMethodId: z.string({ required_error: translations.paymentMethodRequired }),
  date: z.date({ required_error: translations.dateRequired }),
});


export function PayCardSummaryDialog({ isOpen, onClose, summary, paymentMethods, onConfirm }: PayCardSummaryDialogProps) {
    const { translations, language } = useTranslations();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [displayAmount, setDisplayAmount] = useState<string>('');

    const formSchema = getFormSchema(translations, summary.totalAmount);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: summary.totalAmount,
            date: new Date(),
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                amount: summary.totalAmount,
                date: new Date(),
                paymentMethodId: undefined,
            });
            setDisplayAmount(formatNumberForDisplay(summary.totalAmount.toFixed(2)));
            setIsSubmitting(false);
        }
    }, [isOpen, summary, form]);
    
    const locales = { en: enUS, es, pt };
    const currentLocale = locales[language] || enUS;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        let numericValue = rawValue.replace(/[^0-9.]/g, '');
        const parts = numericValue.split('.');
        
        if (parts.length > 2) {
            numericValue = `${parts[0]}.${parts.slice(1).join('')}`;
        }
    
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
            numericValue = parts.join('.');
        }
        
        const formattedDisplay = formatNumberForDisplay(numericValue);
        setDisplayAmount(formattedDisplay);
        
        const valueForForm = numericValue.replace(/,/g, '');
        const parsedNumber = parseFloat(valueForForm);
        form.setValue('amount', isNaN(parsedNumber) ? undefined : parsedNumber, { shouldValidate: true });
    };

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        await onConfirm(values);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{translations.payCardSummary}</DialogTitle>
                    <DialogDescription className="text-base pt-2">{translations.payCardSummaryDesc.replace('{cardName}', summary.cardName)}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{translations.amountToPay}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            value={displayAmount}
                                            onChange={handleAmountChange}
                                            onBlur={field.onBlur}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="paymentMethodId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{translations.paymentFrom}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={translations.paymentType} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {paymentMethods.map((pm) => (
                                                <SelectItem key={pm.id} value={pm.id}>
                                                    {pm.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>{translations.paymentDate}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: currentLocale })
                                            ) : (
                                                <span>{translations.date}</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                {translations.cancel}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                {isSubmitting ? `${translations.processing}...` : translations.pay}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    