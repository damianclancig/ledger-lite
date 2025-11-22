"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addTax, getUniqueTaxNames } from "@/app/actions/taxActions";
import { isErrorResponse } from "@/lib/error-helpers";
import { TaxForm, type TaxFormSubmitValues } from "@/components/taxes/TaxForm";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";

export default function AddTaxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();
  const [taxNames, setTaxNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialData = useMemo(() => {
    const name = searchParams.get('name');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const data: Partial<TaxFormSubmitValues> = {};
    if (name) data.name = name;
    if (month) data.month = parseInt(month, 10);
    if (year) data.year = parseInt(year, 10);

    return Object.keys(data).length > 0 ? data : undefined;
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getUniqueTaxNames(user.uid)
      .then(result => {
        if (isErrorResponse(result)) {
          console.error('Error loading tax names:', result.error);
          setTaxNames([]);
        } else {
          const filteredNames = initialData?.name ? result.filter(n => n !== initialData.name) : result;
          setTaxNames(filteredNames);
        }
      })
      .finally(() => setIsLoading(false));
  }, [user, initialData]);

  const handleFormSubmit = async (values: TaxFormSubmitValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addTax(values, user.uid, translations);

    if (isErrorResponse(result)) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.taxAddedTitle, description: translations.taxAddedDesc });
      router.push("/taxes");
    }
  };
  
  if (isLoading) {
    return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.newTax} backHref="/taxes">
      <TaxForm
        key={JSON.stringify(initialData)} // Re-mount form when initialData changes
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/taxes")}
        existingTaxNames={taxNames}
        initialData={initialData}
      />
    </FormPageLayout>
  );
}
