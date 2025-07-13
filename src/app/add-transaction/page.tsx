"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addTransaction, markTaxAsPaid } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

function AddTransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const [initialData, setInitialData] = React.useState<Partial<TransactionFormValues> | undefined>();
  const [isReady, setIsReady] = React.useState(false);

  const taxId = searchParams.get('taxId');

  useEffect(() => {
    // If we have search params, we're likely coming from the taxes page.
    const description = searchParams.get('description');
    const amount = searchParams.get('amount');
    const category = searchParams.get('category');
    
    if (description && amount && category) {
      setInitialData({
        description,
        amount: parseFloat(amount),
        date: new Date(),
        category: category as any, // Assume it's a valid category
        type: 'expense',
        paymentType: 'Cash' // Default payment type
      });
    }
    setIsReady(true);
  }, [searchParams]);

  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addTransaction(values, user.uid);

    if (result && 'error' in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result) {
      // If the transaction was for a tax, mark the tax as paid
      if (taxId) {
        await markTaxAsPaid(taxId, result.id, user.uid);
      }
      toast({ title: "Transaction added", description: "New transaction successfully recorded." });
      // Redirect based on origin
      const redirectPath = taxId ? '/taxes' : '/';
      router.push(redirectPath);
    }
  };

  const handleClose = () => {
    const redirectPath = taxId ? '/taxes' : '/';
    router.push(redirectPath);
  }

  if (!isReady) {
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
      <Button asChild variant="ghost" className="mb-4" onClick={handleClose}>
        <span className="cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translations.back}
        </span>
      </Button>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <CardTitle>{translations.addTransaction}</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            onSubmit={handleFormSubmit}
            onClose={handleClose}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddTransactionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddTransactionContent />
    </Suspense>
  )
}
