
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SavingsFund, PaymentMethod, Translations } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";

interface CloseFundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fund: SavingsFund;
  paymentMethods: PaymentMethod[];
  onConfirm: (paymentMethodId: string) => void;
}

const getFormSchema = (translations: Translations) => z.object({
  paymentMethodId: z.string({ required_error: translations.paymentMethodRequired }),
});

export function CloseFundDialog({
  isOpen,
  onClose,
  fund,
  paymentMethods,
  onConfirm,
}: CloseFundDialogProps) {
  const { translations } = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompleted = fund.targetAmount > 0 && fund.currentAmount >= fund.targetAmount;

  const formSchema = getFormSchema(translations);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethodId: undefined,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setIsSubmitting(false);
    }
  }, [isOpen, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    onConfirm(values.paymentMethodId);
  };

  const title = isCompleted ? translations.confirmCloseFundTitle : translations.deleteSavingsFund;
  const description = (isCompleted 
    ? translations.confirmCloseFundDescription 
    : translations.areYouSureDeleteFundWithBalance
  ).replace('{amount}', formatCurrency(fund.currentAmount));
  
  const buttonText = isCompleted ? translations.closeFund : translations.delete;
  const buttonVariant = isCompleted ? 'default' : 'destructive';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-base pt-2">{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="paymentMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.selectPaymentMethodReceive}</FormLabel>
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
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {translations.cancel}
              </Button>
              <Button type="submit" variant={buttonVariant} disabled={isSubmitting}>
                {isSubmitting ? `${translations.processing}...` : buttonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
