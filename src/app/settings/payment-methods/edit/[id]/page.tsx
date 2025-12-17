"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getPaymentMethodById, updatePaymentMethod } from "@/app/actions/paymentMethodActions";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";
import type { PaymentMethod, PaymentMethodFormValues } from "@/types";
import { PaymentMethodForm } from "@/components/settings/PaymentMethodForm";

export default function EditPaymentMethodPage() {
  const router = useRouter();
  const params = useParams();
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      if (!dbUser) return; // Additional check for TypeScript
      setIsLoading(true);
      try {
        const fetchedMethod = await getPaymentMethodById(id);

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
  }, [id, dbUser, router, toast, translations]);

  const handleFormSubmit = async (values: PaymentMethodFormValues) => {
    if (!dbUser || !paymentMethod) return;

    const result = await updatePaymentMethod(paymentMethod.id, values);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.paymentMethodUpdatedSuccess });
      router.push("/settings/payment-methods");
    }
  };

  if (isLoading || !paymentMethod) {
    return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.editPaymentMethod} backHref="/settings/payment-methods">
      <PaymentMethodForm
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/settings/payment-methods")}
        initialData={paymentMethod}
      />
    </FormPageLayout>
  );
}
