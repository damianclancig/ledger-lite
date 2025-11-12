"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getInstallmentPurchaseByGroupId, updateInstallmentPurchase } from "@/app/actions/transactionActions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";
import type { Transaction, Category, PaymentMethod } from "@/types";

export default function EditInstallmentPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();
  
  const [purchase, setPurchase] = useState<Partial<Transaction> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const groupId = params.groupId as string;
  
  useEffect(() => {
    if (!groupId || !user) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedPurchase, userCategories, userPaymentMethods] = await Promise.all([
          getInstallmentPurchaseByGroupId(groupId, user.uid),
          getCategories(user.uid),
          getPaymentMethods(user.uid),
        ]);
        
        if (fetchedPurchase) {
          setPurchase(fetchedPurchase);
          setCategories(userCategories);
          setPaymentMethods(userPaymentMethods);
        } else {
          toast({ title: translations.errorTitle, description: "Installment purchase not found.", variant: "destructive" });
          router.push('/dashboard');
        }
      } catch (error) {
         toast({ title: translations.errorTitle, description: "Failed to load purchase data.", variant: "destructive" });
         router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [groupId, user, router, toast, translations]);

  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!user || !purchase?.groupId) return;

    const result = await updateInstallmentPurchase(purchase.groupId, values, user.uid);

    if (result.success) {
        toast({ title: translations.transactionUpdatedTitle, description: "The installment purchase has been successfully updated." });
        router.push('/dashboard');
    } else {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    }
  };
  
  if (isLoading || !purchase) {
    return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.editTransaction} backHref="/dashboard">
      <TransactionForm
        onSubmit={handleFormSubmit}
        onClose={() => router.back()}
        initialData={purchase as Transaction}
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </FormPageLayout>
  );
}
