"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getPaymentMethodById, updatePaymentMethod } from "@/app/actions/paymentMethodActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentMethod, PaymentMethodFormValues } from "@/types";
import { Separator } from "@/components/ui/separator";
import { PaymentMethodForm } from "@/components/settings/PaymentMethodForm";

export default function EditPaymentMethodPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
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
        const fetchedMethod = await getPaymentMethodById(id, user.uid);
        
        if (fetchedMethod) {
          setPaymentMethod(fetchedMethod);
        } else {
          toast({ title: translations.errorTitle, description: "Payment Method not found or you don't have permission to view it.", variant: "destructive" });
          router.push("/settings/payment-methods");
        }
      } catch (error) {
         toast({ title: translations.errorTitle, description: "Failed to load payment method data.", variant: "destructive" });
         router.push("/settings/payment-methods");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, user, router, toast, translations]);

  const handleFormSubmit = async (values: PaymentMethodFormValues) => {
    if (!user || !paymentMethod) return;

    const result = await updatePaymentMethod(paymentMethod.id, values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.paymentMethodUpdatedSuccess });
      router.push("/settings/payment-methods");
    }
  };
  
  if (isLoading || !paymentMethod) {
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
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
       <div className="flex justify-end mb-4">
        <Button asChild variant="ghost" className="text-base">
            <Link href="/settings/payment-methods">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.back}
            </Link>
        </Button>
      </div>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="p-4 pb-2">
          <CardTitle>{translations.editPaymentMethod}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <PaymentMethodForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/settings/payment-methods")}
            initialData={paymentMethod}
          />
        </CardContent>
      </Card>
    </div>
  );
}
