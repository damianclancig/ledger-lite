
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addPaymentMethod } from "@/app/actions";
import { PaymentMethodForm } from "@/components/settings/PaymentMethodForm";
import type { PaymentMethodFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import React, { useEffect } from "react";

export default function AddPaymentMethodPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <CardTitle>{translations.newPaymentMethod}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <PaymentMethodForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/settings/payment-methods")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
