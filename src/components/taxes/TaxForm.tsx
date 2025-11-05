
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState, useEffect, useRef } from "react";

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
import type { Tax, TaxFormValues, Translations } from "@/types";
import { MONTHS } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatNumberForDisplay } from "@/lib/utils";

export type TaxFormSubmitValues = z.infer<ReturnType<typeof getFormSchema>>;

interface TaxFormProps {
  onSubmit: (values: TaxFormSubmitValues) => void;
  onClose: () => void;
  initialData?: Partial<Tax>;
  existingTaxNames?: string[];
}

const getFormSchema = (translations: Translations) => z.object({
  name: z.string().min(1, { message: translations.taxNameRequired }),
  month: z.coerce.number().min(0).max(11),
  year: z.coerce.number(),
  amount: z.coerce
    .number({ required_error: translations.amountRequired, invalid_type_error: translations.amountRequired })
    .positive({ message: translations.amountPositive }),
});

export function TaxForm({ onSubmit, onClose, initialData, existingTaxNames = [] }: TaxFormProps) {
  const { translations, translateMonth } = useTranslations();
  const [displayAmount, setDisplayAmount] = useState<string>("");
  const formSchema = getFormSchema(translations);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = [currentYear -1, currentYear, currentYear + 1];

  const form = useForm<TaxFormSubmitValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      month: initialData?.month ?? new Date().getMonth(),
      year: initialData?.year ?? currentYear,
      amount: initialData?.amount,
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        month: initialData.month ?? new Date().getMonth(),
        year: initialData.year ?? currentYear,
        amount: initialData.amount,
      });
      if (initialData.amount) {
        setDisplayAmount(formatNumberForDisplay(String(initialData.amount.toFixed(2))));
      }
    }
  }, [initialData, form, currentYear]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("name", value);
    if (value) {
      const filtered = existingTaxNames.filter(name => 
        name.toLowerCase().includes(value.toLowerCase()) && name.toLowerCase() !== value.toLowerCase()
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (name: string) => {
    form.setValue("name", name);
    setShowSuggestions(false);
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
    
    const formattedDisplay = formatNumberForDisplay(numericValue);
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
            <FormItem ref={suggestionsRef} className="relative">
              <FormLabel><Landmark className="inline-block mr-2 h-4 w-4" />{translations.taxName}</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder={translations.newTax} 
                  onChange={handleNameChange}
                  autoComplete="off"
                />
              </FormControl>
              {showSuggestions && suggestions.length > 0 && (
                 <div className="absolute w-full mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {suggestions.map(suggestion => (
                    <button
                        type="button"
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-base hover:bg-accent"
                    >
                        {suggestion}
                    </button>
                    ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Calendar className="inline-block mr-2 h-4 w-4" />{translations.year}</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-2">
                  {years.map(year => (
                    <Button
                      key={year}
                      type="button"
                      variant={field.value === year ? "default" : "outline"}
                      onClick={() => field.onChange(year)}
                      className={cn(
                        "text-base transition-colors duration-200",
                        field.value === year ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
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
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
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
                        setDisplayAmount(formatNumberForDisplay(String(value.toFixed(2))));
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
