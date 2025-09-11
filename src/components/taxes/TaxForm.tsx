
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Landmark, Calendar } from "lucide-react";
import type { TaxFormValues, Translations, Month } from "@/types";
import { MONTHS } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";

export type TaxFormSubmitValues = z.infer<ReturnType<typeof getFormSchema>>;

interface TaxFormProps {
  onSubmit: (values: TaxFormSubmitValues) => void;
  onClose: () => void;
}

const getFormSchema = (translations: Translations) => z.object({
  name: z.string().min(1, { message: translations.taxNameRequired }),
  month: z.coerce.number({ required_error: translations.monthRequired, invalid_type_error: translations.monthRequired }),
  amount: z.coerce
    .number({ required_error: translations.amountRequired, invalid_type_error: translations.amountRequired })
    .positive({ message: translations.amountPositive }),
});

export function TaxForm({ onSubmit, onClose }: TaxFormProps) {
  const { translations, translateMonth } = useTranslations();
  const [displayAmount, setDisplayAmount] = useState<string>("");

  const formSchema = getFormSchema(translations);

  const form = useForm<TaxFormSubmitValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      month: undefined,
      amount: undefined,
    },
  });

  const formatNumberWithCommas = (numStr: string): string => {
    if (!numStr) return '';
    const parts = numStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
    if (decimalPart !== undefined) {
      return `${formattedIntegerPart}.${decimalPart}`;
    }
    
    if (numStr.slice(-1) === '.') {
      return `${formattedIntegerPart}.`;
    }
    return formattedIntegerPart;
  };
  
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
    
    const valueForForm = numericValue.endsWith('.') ? numericValue.slice(0, -1) : numericValue;
    const parsedNumber = parseFloat(valueForForm);

    if (!isNaN(parsedNumber)) {
        form.setValue('amount', parsedNumber, { shouldValidate: true });
    } else {
        form.setValue('amount', undefined, { shouldValidate: true });
    }
  };
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Landmark className="inline-block mr-2 h-4 w-4" />{translations.taxName}</FormLabel>
              <FormControl>
                <Input placeholder={translations.taxName} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Calendar className="inline-block mr-2 h-4 w-4" />{translations.month}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value !== undefined ? String(field.value) : ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.month} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={month} value={String(index)}>
                        {translateMonth(index)}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel><DollarSign className="inline-block mr-2 h-4 w-4" />{translations.amount}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    onBlur={() => {
                      field.onBlur();
                      const value = form.getValues('amount');
                      if (value) {
                        setDisplayAmount(formatNumberWithCommas(value.toFixed(2)));
                      } else {
                        setDisplayAmount('');
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="text-base">
            {translations.cancel}
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-base">
            {translations.save}
          </Button>
        </div>
      </form>
    </Form>
  );
}
