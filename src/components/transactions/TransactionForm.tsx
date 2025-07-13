
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es, pt, enUS } from "date-fns/locale";
import React, { useEffect, useState } from "react";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CalendarIcon, DollarSign, Edit3, Type, ListTree, CreditCard } from "lucide-react";
import type { Transaction, Category, PaymentType, TransactionType, Translations } from "@/types";
import { CATEGORIES, PAYMENT_TYPES } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/ui/textarea";

export type TransactionFormValues = z.infer<ReturnType<typeof getFormSchema>>;

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  initialData?: Partial<Transaction>;
  onClose: () => void;
  isTaxPayment?: boolean;
}

const getFormSchema = (translations: Translations) => z.object({
  description: z.string().min(1, { message: translations.descriptionRequired }).max(100, { message: translations.descriptionMaxLength }),
  amount: z.coerce
    .number({ required_error: translations.amountRequired, invalid_type_error: translations.amountRequired })
    .positive({ message: translations.amountPositive }),
  date: z.date({ required_error: translations.dateRequired }),
  category: z.enum(CATEGORIES, { required_error: translations.categoryRequired }),
  type: z.enum(["income", "expense"], { required_error: translations.typeRequired }),
  paymentType: z.enum(PAYMENT_TYPES, { required_error: translations.paymentTypeRequired }),
});

export function TransactionForm({ onSubmit, initialData, onClose, isTaxPayment = false }: TransactionFormProps) {
  const { translations, translateCategory, translatePaymentType, language } = useTranslations();
  const [isCalendarOpen, setCalendarOpen] = React.useState(false);
  const [displayAmount, setDisplayAmount] = useState<string>("");

  const formSchema = getFormSchema(translations);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      category: initialData?.category || undefined,
      type: initialData?.type || undefined,
      paymentType: initialData?.paymentType || undefined,
    },
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

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: initialData.date ? new Date(initialData.date) : new Date(),
      });
      if (initialData.amount) {
        setDisplayAmount(formatNumberWithCommas(initialData.amount.toFixed(2)));
      } else {
        setDisplayAmount("");
      }
    } else {
      form.reset({
        description: "",
        amount: undefined,
        date: new Date(),
        category: undefined,
        type: undefined,
        paymentType: undefined,
      });
      setDisplayAmount("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, form.reset]);
  
  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

  const handleSubmit = (values: TransactionFormValues) => {
    onSubmit(values);
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
    
    const valueForForm = numericValue.replace(/,/g, '');
    const parsedNumber = parseFloat(valueForForm);
    form.setValue('amount', isNaN(parsedNumber) ? undefined : parsedNumber, { shouldValidate: true });
  };
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Edit3 className="inline-block mr-2 h-4 w-4" />{translations.description}</FormLabel>
              <FormControl>
                <Textarea placeholder={translations.description} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
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
                    onBlur={field.onBlur} // Keep onBlur for validation triggers
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel><CalendarIcon className="inline-block mr-2 h-4 w-4" />{translations.date}</FormLabel>
                <FormControl>
                  <Button
                    type="button"
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                    onClick={() => setCalendarOpen(true)}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: currentLocale })
                    ) : (
                      <span>{translations.date}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
                <Dialog open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                  <DialogContent className="w-auto p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>{translations.date}</DialogTitle>
                    </DialogHeader>
                    <Calendar
                      locale={currentLocale}
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) field.onChange(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </DialogContent>
                </Dialog>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Type className="inline-block mr-2 h-4 w-4" />{translations.type}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isTaxPayment}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.type} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">{translations.income}</SelectItem>
                    <SelectItem value="expense">{translations.expense}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel><ListTree className="inline-block mr-2 h-4 w-4" />{translations.category}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isTaxPayment}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.category} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {translateCategory(cat as Category)}
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
            name="paymentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel><CreditCard className="inline-block mr-2 h-4 w-4" />{translations.paymentType}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.paymentType} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>
                        {translatePaymentType(pt as PaymentType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {translations.cancel}
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            {translations.save}
          </Button>
        </div>
      </form>
    </Form>
  );
}
