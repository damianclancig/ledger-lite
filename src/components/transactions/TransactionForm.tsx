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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CalendarIcon, DollarSign, Edit3, Type, ListTree, CreditCard, TrendingUp, TrendingDown, Layers } from "lucide-react";
import type { Transaction, Category, PaymentMethod, Translations } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";


export type TransactionFormValues = Omit<Transaction, "id" | "userId">;

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  onSaveAndAddAnother?: (values: TransactionFormValues) => void;
  initialData?: Partial<Transaction>;
  onClose: () => void;
  isTaxPayment?: boolean;
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

const getFormSchema = (translations: Translations) => z.object({
  description: z.string().min(1, { message: translations.descriptionRequired }).max(100, { message: translations.descriptionMaxLength }),
  amount: z.coerce
    .number({ required_error: translations.amountRequired, invalid_type_error: translations.amountRequired })
    .positive({ message: translations.amountPositive }),
  date: z.date({ required_error: translations.dateRequired }),
  categoryId: z.string({ required_error: translations.categoryRequired }),
  type: z.enum(["income", "expense"], { required_error: translations.typeRequired }),
  paymentMethodId: z.string({ required_error: translations.paymentMethodRequired }),
  installments: z.number().optional(),
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

export function TransactionForm({ onSubmit, onSaveAndAddAnother, initialData, onClose, isTaxPayment = false, categories, paymentMethods }: TransactionFormProps) {
  const { translations, language, translateCategory } = useTranslations();
  const [isCalendarOpen, setCalendarOpen] = React.useState(false);
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [showInstallments, setShowInstallments] = useState(false);
  const [installments, setInstallments] = useState(initialData?.installments || 1);

  const formSchema = getFormSchema(translations);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      categoryId: initialData?.categoryId || undefined,
      type: initialData?.type || undefined,
      paymentMethodId: initialData?.paymentMethodId || undefined,
      installments: initialData?.installments || 1,
    },
  });
  
  useEffect(() => {
    if (initialData?.amount) {
      setDisplayAmount(formatNumberWithCommas(initialData.amount.toFixed(2)));
    }
    form.reset({
      description: initialData?.description || "",
      amount: initialData?.amount,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      categoryId: initialData?.categoryId || undefined,
      type: initialData?.type || undefined,
      paymentMethodId: initialData?.paymentMethodId || undefined,
      installments: initialData?.installments || 1,
    });
  }, [initialData, form]);

  const selectedPaymentMethodId = form.watch("paymentMethodId");

  useEffect(() => {
    const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
    if (paymentMethod && paymentMethod.type === 'Credit Card') {
      setShowInstallments(true);
    } else {
      setShowInstallments(false);
      setInstallments(1);
      form.setValue('installments', 1);
    }
  }, [selectedPaymentMethodId, paymentMethods, form]);
  
  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };
  
  const handleSaveAndAddAnother = (values: z.infer<typeof formSchema>) => {
    if (onSaveAndAddAnother) {
      onSaveAndAddAnother(values);
    }
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
  
  const handleInstallmentsChange = (value: number[]) => {
    setInstallments(value[0]);
    form.setValue('installments', value[0]);
  };

  const getCategoryDisplay = (cat: Category) => {
    if (cat.name === "Taxes" && language !== "en") {
      return `Taxes (${translateCategory("Taxes")})`;
    }
    return cat.name;
  };

  return (
    <Form {...form}>
      <form className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
                      "w-full pl-3 text-left font-normal text-base",
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
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Type className="inline-block mr-2 h-4 w-4" />{translations.type}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 gap-4"
                  disabled={isTaxPayment}
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="income" id="income" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor="income"
                       className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 p-2 cursor-pointer transition-colors duration-300 text-base",
                        field.value === 'income'
                          ? "bg-green-800 border-green-800 text-white font-semibold dark:bg-green-600 dark:border-green-600 dark:text-white"
                          : "font-normal bg-green-100 border-green-600 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:border-green-950 dark:hover:bg-green-900 dark:text-green-300"
                      )}
                    >
                      <TrendingUp className={cn("mb-1 h-5 w-5", field.value === 'income' ? 'text-white' : 'text-green-500')} />
                      {translations.income}
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="expense" id="expense" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor="expense"
                       className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 p-2 cursor-pointer transition-colors duration-300 text-base",
                         field.value === 'expense'
                          ? "bg-red-800 border-red-800 text-white font-semibold dark:bg-red-600 dark:border-red-600 dark:text-white"
                          : "font-normal bg-red-100 border-red-600 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:border-red-950 dark:hover:bg-red-900 dark:text-red-300"
                      )}
                    >
                      <TrendingDown className={cn("mb-1 h-5 w-5", field.value === 'expense' ? 'text-white' : 'text-red-500')} />
                      {translations.expense}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
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
                    {categories.filter(c => c.isEnabled).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {getCategoryDisplay(cat)}
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
            name="paymentMethodId"
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
                    {paymentMethods.filter(pm => pm.isEnabled).map((pm) => (
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
        </div>
        
        {showInstallments && (
          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Layers className="inline-block mr-2 h-4 w-4" />Cuotas: {installments}</FormLabel>
                <FormControl>
                  <Slider
                    defaultValue={[1]}
                    min={1}
                    max={24}
                    step={1}
                    onValueChange={handleInstallmentsChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="pt-2 flex flex-col md:flex-row md:justify-end gap-3">
          {onSaveAndAddAnother && !initialData && (
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(handleSaveAndAddAnother)}
              className="w-full md:w-auto md:order-2 text-base"
            >
              {translations.saveAndAddAnother}
            </Button>
          )}
          <div className="flex w-full md:w-auto gap-3 order-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 md:flex-initial text-base">
              {translations.cancel}
            </Button>
            <Button type="button" onClick={form.handleSubmit(handleSubmit)} className="bg-primary hover:bg-primary/90 flex-1 md:flex-initial text-base">
              {translations.save}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
