"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addTransaction, markTaxAsPaid } from "@/app/actions/transactionActions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";
import type { Category, PaymentMethod } from "@/types";

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
  const redirectPath = taxId ? '/taxes' : '/dashboard';

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
      if (taxId) {
        await markTaxAsPaid(taxId, result.id, user.uid);
      }
      toast({ title: translations.transactionAddedTitle, description: translations.transactionAddedDesc });
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
        setFormKey(Date.now());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  if (isLoading) {
     return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.addTransaction} backHref={redirectPath}>
      <TransactionForm
        key={formKey}
        onSubmit={handleFormSubmit}
        onSaveAndAddAnother={handleSaveAndAddAnother}
        onClose={() => router.push(redirectPath)}
        initialData={initialData}
        isTaxPayment={isTaxPayment}
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </FormPageLayout>
  );
}
