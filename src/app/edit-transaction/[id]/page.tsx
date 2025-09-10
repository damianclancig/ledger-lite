
"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getTransactionById, updateTransaction, getCategories, getPaymentMethods } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, Category, PaymentMethod } from "@/types";
import { Separator } from "@/components/ui/separator";

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedTransaction, userCategories, userPaymentMethods] = await Promise.all([
          getTransactionById(id, user.uid),
          getCategories(user.uid),
          getPaymentMethods(user.uid)
        ]);
        
        if (fetchedTransaction) {
          setTransaction(fetchedTransaction);
          setCategories(userCategories);
          setPaymentMethods(userPaymentMethods);
        } else {
          toast({ title: translations.errorTitle, description: "Transaction not found or you don't have permission to view it.", variant: "destructive" });
          router.push("/dashboard");
        }
      } catch (error) {
         toast({ title: translations.errorTitle, description: "Failed to load data.", variant: "destructive" });
         router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, user, router, toast, translations]);

  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }
    
    if (!transaction) return;

    const result = await updateTransaction(transaction.id, values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.transactionUpdatedTitle, description: translations.transactionUpdatedDesc });
      router.push("/dashboard");
    }
  };
  
  if (isLoading || !transaction) {
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
      <Button asChild variant="ghost" className="mb-4 text-base">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translations.back}
        </Link>
      </Button>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="p-6 pb-4">
          <CardTitle>{translations.editTransaction}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 pt-4">
          <TransactionForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/dashboard")}
            initialData={transaction}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        </CardContent>
      </Card>
    </div>
  );
}
