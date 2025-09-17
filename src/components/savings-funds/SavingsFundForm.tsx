"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es, pt, enUS } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CalendarIcon, DollarSign, PiggyBank, Edit3 } from "lucide-react";
import type { SavingsFund, Translations } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";

export type SavingsFundFormSubmitValues = z.infer<ReturnType<typeof getFormSchema>>;

interface SavingsFundFormProps {
  onSubmit: (values: SavingsFundFormSubmitValues) => void;
  onClose: () => void;
  initialData?: Partial<SavingsFund>;
}

const getFormSchema = (translations: Translations) => z.object({
  name: z.string().min(1, { message: translations.savingsFundNameRequired }),
  description: z.string().min(1, { message: translations.savingsFundDescriptionRequired }),
  targetAmount: z.coerce.number({ required_error: translations.savingsFundTargetAmountRequired }).positive({ message: translations.savingsFundTargetAmountPositive }),
  targetDate: z.date().optional(),
});

const formatNumberWithCommas = (numStr: string): string => {
  if (!numStr) return '';
  const [integerPart, decimalPart] = numStr.split('.');
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decimalPart !== undefined) {
    return `${formattedIntegerPart}.${decimalPart}`;
  }
  return formattedIntegerPart;
};

export function SavingsFundForm({ onSubmit, onClose, initialData }: SavingsFundFormProps) {
  const { translations, language } = useTranslations();
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [displayAmount, setDisplayAmount] = useState<string>('');

  const formSchema = getFormSchema(translations);

  const form = useForm<SavingsFundFormSubmitValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      targetAmount: initialData?.targetAmount,
      targetDate: initialData?.targetDate ? new Date(initialData.targetDate) : undefined,
    },
  });

  useEffect(() => {
    if (initialData?.targetAmount) {
      setDisplayAmount(formatNumberWithCommas(initialData.targetAmount.toFixed(2)));
    }
    form.reset({
      name: initialData?.name || "",
      description: initialData?.description || "",
      targetAmount: initialData?.targetAmount,
      targetDate: initialData?.targetDate ? new Date(initialData.targetDate) : undefined,
    });
  }, [initialData, form]);

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
    
    const formattedDisplay = formatNumberWithCommas(numericValue);
    setDisplayAmount(formattedDisplay);
    
    const valueForForm = numericValue.replace(/,/g, '');
    const parsedNumber = parseFloat(valueForForm);
    form.setValue('targetAmount', isNaN(parsedNumber) ? undefined : parsedNumber, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel><PiggyBank className="inline-block mr-2 h-4 w-4" />{translations.savingsFundName}</FormLabel>
              <FormControl>
                <Input placeholder={translations.savingsFundName} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Edit3 className="inline-block mr-2 h-4 w-4" />{translations.savingsFundDescription}</FormLabel>
              <FormControl>
                <Textarea placeholder={translations.savingsFundDescription} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel><DollarSign className="inline-block mr-2 h-4 w-4" />{translations.savingsFundTargetAmount}</FormLabel>
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
          name="targetDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel><CalendarIcon className="inline-block mr-2 h-4 w-4" />{translations.savingsFundTargetDate}</FormLabel>
              <FormControl>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn("w-full pl-3 text-left font-normal text-base", !field.value && "text-muted-foreground")}
                  onClick={() => setCalendarOpen(true)}
                >
                  {field.value ? format(field.value, "PPP", { locale: currentLocale }) : <span>{translations.savingsFundTargetDate}</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
              <Dialog open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                <DialogContent className="w-auto p-0">
                  <DialogHeader className="sr-only"><DialogTitle>{translations.date}</DialogTitle></DialogHeader>
                  <Calendar
                    locale={currentLocale}
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </DialogContent>
              </Dialog>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {translations.cancel}
          </Button>
          <Button type="submit">{translations.save}</Button>
        </div>
      </form>
    </Form>
  );
}
