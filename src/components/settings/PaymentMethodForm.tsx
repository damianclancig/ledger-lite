
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect } from "react";

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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaymentMethod, PaymentMethodFormValues, Translations, PaymentMethodType } from "@/types";
import { PAYMENT_METHOD_TYPES } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";

interface PaymentMethodFormProps {
  onSubmit: (values: PaymentMethodFormValues) => void;
  onClose: () => void;
  initialData?: Partial<PaymentMethod>;
}

const getFormSchema = (translations: Translations) => z.object({
  name: z.string().min(1, { message: translations.paymentMethodNameRequired }),
  type: z.enum(PAYMENT_METHOD_TYPES, { required_error: translations.paymentMethodTypeRequired }),
  bank: z.string().optional(),
  isEnabled: z.boolean().default(true),
});

export function PaymentMethodForm({ onSubmit, onClose, initialData }: PaymentMethodFormProps) {
  const { translations, translatePaymentType } = useTranslations();
  const formSchema = getFormSchema(translations);

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: undefined,
      bank: "",
      isEnabled: true,
      ...initialData,
    },
  });

  useEffect(() => {
    form.reset({
      name: "",
      type: undefined,
      bank: "",
      isEnabled: true,
      ...initialData,
    });
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.paymentMethodName}</FormLabel>
                <FormControl>
                  <Input placeholder={translations.paymentMethodName} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.paymentMethodType}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.paymentMethodType} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_METHOD_TYPES.map((pm) => (
                      <SelectItem key={pm} value={pm}>
                        {translatePaymentType(pm as PaymentMethodType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="bank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.paymentMethodBank}</FormLabel>
                <FormControl>
                  <Input placeholder={translations.paymentMethodBankPlaceholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>{translations.paymentMethodStatus}</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
