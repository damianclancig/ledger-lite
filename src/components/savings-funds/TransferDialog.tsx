
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescriptionPrimitive } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SavingsFund, Category, PaymentMethod, Translations } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { transferToFund, withdrawFromFund } from "@/app/actions/savingsFundActions";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TransferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fund: SavingsFund;
  type: 'deposit' | 'withdrawal';
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
}

const getFormSchema = (translations: Translations, type: 'deposit' | 'withdrawal', maxAmount?: number) => z.object({
  amount: z.coerce
    .number({ required_error: translations.amountRequired, invalid_type_error: translations.amountRequired })
    .positive({ message: translations.amountPositive })
    .max(maxAmount !== undefined && maxAmount > 0 ? maxAmount : Infinity, { 
        message: type === 'withdrawal' ? translations.withdrawAmountError : translations.depositAmountError
    }),
  paymentMethodId: z.string({ required_error: translations.paymentMethodRequired }),
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

export function TransferDialog({ isOpen, onOpenChange, fund, type, categories, paymentMethods, onSuccess }: TransferDialogProps) {
  const { translations } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayAmount, setDisplayAmount] = useState<string>('');

  const maxAmount = type === 'deposit' 
    ? (fund.targetAmount > 0 ? fund.targetAmount - fund.currentAmount : Infinity)
    : fund.currentAmount;

  const formSchema = getFormSchema(translations, type, maxAmount);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as any,
      paymentMethodId: undefined,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setDisplayAmount('');
      setIsSubmitting(false);
    }
  }, [isOpen, form]);

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
    form.setValue('amount', isNaN(parsedNumber) ? '' as any : parsedNumber, { shouldValidate: true });
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsSubmitting(true);

    const transferCategory = categories.find(c => c.name === "Savings");
    if (!transferCategory) {
      toast({ title: translations.errorTitle, description: "Savings category not found.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    const action = type === 'deposit' ? transferToFund : withdrawFromFund;
    const description = type === 'deposit' 
        ? translations.transferTo.replace('{fundName}', fund.name)
        : translations.withdrawFrom.replace('{fundName}', fund.name);
        
    const result = await action({
        ...values,
        description,
        categoryId: transferCategory.id,
        fundId: fund.id,
        date: new Date(),
    }, user.uid);

    if (result.success) {
      toast({ title: translations.transferSuccess });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({ title: translations.errorTitle, description: result.error || translations.transferError, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const title = type === 'deposit' 
    ? translations.transferTo.replace('{fundName}', fund.name) 
    : translations.withdrawFrom.replace('{fundName}', fund.name);
    
  const showDepositHelper = type === 'deposit' && fund.targetAmount > 0 && maxAmount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {type === 'withdrawal' && (
            <DialogDescription>
              {translations.availableToWithdraw}: {formatCurrency(fund.currentAmount)}
            </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  {showDepositHelper && (
                    <FormDescriptionPrimitive>
                        {translations.maxToReachGoal.replace('{amount}', formatCurrency(maxAmount))}
                    </FormDescriptionPrimitive>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{translations.paymentType}</FormLabel>
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
            <DialogFooter className="flex-row justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {translations.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? `${translations.transfer}...` : translations.transfer}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    