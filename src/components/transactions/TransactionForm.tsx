
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es, pt, enUS } from "date-fns/locale";
import React from "react";

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
import type { Transaction, Category, PaymentType, TransactionType } from "@/types";
import { CATEGORIES, PAYMENT_TYPES } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }).max(100),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  date: z.date({ required_error: "Date is required." }),
  category: z.enum(CATEGORIES, { required_error: "Category is required." }),
  type: z.enum(["income", "expense"], { required_error: "Type is is required." }),
  paymentType: z.enum(PAYMENT_TYPES, { required_error: "Payment type is required." }),
});

export type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  initialData?: Partial<Transaction>;
  onClose: () => void;
}

export function TransactionForm({ onSubmit, initialData, onClose }: TransactionFormProps) {
  const { translations, translateCategory, translatePaymentType, language } = useTranslations();
  const [isCalendarOpen, setCalendarOpen] = React.useState(false);

  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount || undefined,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      category: initialData?.category || CATEGORIES[0],
      type: initialData?.type || "expense",
      paymentType: initialData?.paymentType || PAYMENT_TYPES[0],
    },
  });

  const handleSubmit = (values: TransactionFormValues) => {
    onSubmit(values);
    form.reset();
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
                  <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
