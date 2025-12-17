"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getTransactionById, updateTransaction } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";
import type { Transaction, Category, PaymentMethod } from "@/types";

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      if (!dbUser) return; // Additional check for TypeScript
      setIsLoading(true);
      try {
        const [fetchedTransaction, userCategories, userPaymentMethods] = await Promise.all([
          getTransactionById(id),
          getCategories(),
          getPaymentMethods(),
        ]);

        if (fetchedTransaction) {
          setTransaction(fetchedTransaction);
          setCategories(userCategories);
          setPaymentMethods(userPaymentMethods);
        } else {
          toast({ title: translations.errorTitle, description: "Transaction not found or you don't have permission to view it.", variant: "destructive" });
          router.back();
        }
      } catch (error) {
        toast({ title: translations.errorTitle, description: "Failed to load data.", variant: "destructive" });
        router.back();
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, dbUser, router, toast, translations]);

  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!dbUser || !transaction) return;

    // Convert date string to Date object for the action
    const formattedValues = {
      ...values,
      date: new Date(values.date),
    };

    const result = await updateTransaction(transaction.id, formattedValues);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.transactionUpdatedTitle, description: translations.transactionUpdatedDesc });
      router.back();
    }
  };

  if (isLoading || !transaction) {
    return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.editTransaction} backHref="/dashboard">
      <TransactionForm
        onSubmit={handleFormSubmit}
        onClose={() => router.back()}
        initialData={transaction}
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </FormPageLayout>
  );
}
