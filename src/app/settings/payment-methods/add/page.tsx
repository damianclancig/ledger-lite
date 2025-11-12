"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addPaymentMethod } from "@/app/actions/paymentMethodActions";
import { PaymentMethodForm } from "@/components/settings/PaymentMethodForm";
import type { PaymentMethodFormValues } from "@/types";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { useTranslations } from "@/contexts/LanguageContext";
import React from "react";

export default function AddPaymentMethodPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const handleFormSubmit = async (values: PaymentMethodFormValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addPaymentMethod(values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.paymentMethodAddedSuccess });
      router.push("/settings/payment-methods");
    }
  };

  return (
    <FormPageLayout title={translations.newPaymentMethod} backHref="/settings/payment-methods">
      <PaymentMethodForm
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/settings/payment-methods")}
      />
    </FormPageLayout>
  );
}
