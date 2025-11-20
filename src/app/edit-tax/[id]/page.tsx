"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getTaxById, updateTax, getUniqueTaxNames } from "@/app/actions/taxActions";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";
import type { Tax } from "@/types";
import { TaxForm, type TaxFormSubmitValues } from "@/components/taxes/TaxForm";

export default function EditTaxPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const [tax, setTax] = useState<Tax | null>(null);
  const [taxNames, setTaxNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      if (!user) return; // Additional check for TypeScript
      setIsLoading(true);
      try {
        const [fetchedTax, uniqueNames] = await Promise.all([
          getTaxById(id, user.uid),
          getUniqueTaxNames(user.uid)
        ]);

        if (fetchedTax) {
          if (fetchedTax.isPaid) {
            toast({ title: translations.errorTitle, description: translations.paidTaxEditError, variant: "destructive" });
            router.push("/taxes");
            return;
          }
          setTax(fetchedTax);
          setTaxNames(uniqueNames.filter(name => name !== fetchedTax.name));
        } else {
          toast({ title: translations.errorTitle, description: "Tax not found.", variant: "destructive" });
          router.push("/taxes");
        }
      } catch (error) {
        toast({ title: translations.errorTitle, description: "Failed to load tax data.", variant: "destructive" });
        router.push("/taxes");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, user, router, toast, translations]);

  const handleFormSubmit = async (values: TaxFormSubmitValues) => {
    if (!user || !tax) return;

    const result = await updateTax(tax.id, {
      name: values.name,
      amount: values.amount,
      month: values.month,
      year: values.year,
    }, user.uid, translations);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.taxUpdatedSuccess });
      router.push("/taxes");
    }
  };

  if (isLoading || !tax) {
    return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.editTax} backHref="/taxes">
      <TaxForm
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/taxes")}
        initialData={tax}
        existingTaxNames={taxNames}
      />
    </FormPageLayout>
  );
}
