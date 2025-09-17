"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addTransaction, markTaxAsPaid } from "@/app/actions/transactionActions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Category, PaymentMethod } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();
  const [formKey, setFormKey] = useState(Date.now());
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      const [userCategories, userPaymentMethods] = await Promise.all([
        getCategories(user.uid),
        getPaymentMethods(user.uid),
      ]);
      setCategories(userCategories);
      setPaymentMethods(userPaymentMethods);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const taxId = searchParams.get('taxId');
  const isTaxPayment = !!taxId;

  // Process search params directly to build initial data for the form.
  const description = searchParams.get('description');
  const amount = searchParams.get('amount');
  const taxCategoryName = searchParams.get('category');
  
  let initialData: Partial<TransactionFormValues> | undefined;
  if (isTaxPayment && description && amount && taxCategoryName) {
    const taxCategory = categories.find(c => c.name === taxCategoryName);
    initialData = {
      description,
      amount: parseFloat(amount),
      date: new Date(),
      categoryId: taxCategory?.id,
      type: 'expense',
      paymentMethodId: undefined,
    };
  }

  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addTransaction(values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else if (result) {
      // If the transaction was for a tax, mark the tax as paid
      if (taxId) {
        await markTaxAsPaid(taxId, result.id, user.uid);
      }
      toast({ title: translations.transactionAddedTitle, description: translations.transactionAddedDesc });
      
      const redirectPath = taxId ? '/taxes' : '/dashboard';
      router.push(redirectPath);
    }
  };
  
  const handleSaveAndAddAnother = async (values: TransactionFormValues) => {
    if (!user) {
        toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
        return;
    }

    const result = await addTransaction(values, user.uid);

    if (result && 'error' in result) {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
        toast({ title: translations.transactionAddedTitle, description: translations.transactionAddedDesc });
        // By changing the key, we force the form to re-mount with initial state
        setFormKey(Date.now());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClose = () => {
    const redirectPath = taxId ? '/taxes' : '/dashboard';
    router.push(redirectPath);
  }
  
  if (isLoading) {
     return (
       <div className="max-w-2xl mx-auto">
        <Skeleton className="h-10 w-24 mb-4" />
        <Card>
          <CardHeader>
             <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-end mb-4">
        <Button variant="ghost" className="text-base" onClick={handleClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.back}
        </Button>
      </div>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="p-4 pb-2">
          <CardTitle>{translations.addTransaction}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <TransactionForm
            key={formKey}
            onSubmit={handleFormSubmit}
            onSaveAndAddAnother={handleSaveAndAddAnother}
            onClose={handleClose}
            initialData={initialData}
            isTaxPayment={isTaxPayment}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        </CardContent>
      </Card>
    </div>
  );
}
