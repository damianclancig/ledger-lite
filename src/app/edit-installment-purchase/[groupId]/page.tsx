
"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getInstallmentPurchaseByGroupId, updateInstallmentPurchase } from "@/app/actions/transactionActions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, Category, PaymentMethod } from "@/types";
import { Separator } from "@/components/ui/separator";

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
    window.scrollTo(0, 0);
  }, []);

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
        <Button variant="ghost" className="text-base" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.back}
        </Button>
       </div>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="p-4 pb-2">
          <CardTitle>{translations.editTransaction}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <TransactionForm
            onSubmit={handleFormSubmit}
            onClose={() => router.back()}
            initialData={purchase as Transaction}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        </CardContent>
      </Card>
    </div>
  );
}
