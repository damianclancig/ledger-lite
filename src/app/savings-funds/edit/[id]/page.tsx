"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSavingsFundById, updateSavingsFund } from "@/app/actions/savingsFundActions";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";
import type { SavingsFund } from "@/types";
import { SavingsFundForm, type SavingsFundFormSubmitValues } from "@/components/savings-funds/SavingsFundForm";

export default function EditSavingsFundPage() {
  const router = useRouter();
  const params = useParams();
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const [fund, setFund] = useState<SavingsFund | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      if (!dbUser) return; // Additional check for TypeScript
      setIsLoading(true);
      try {
        const fetchedFund = await getSavingsFundById(id);

        if (fetchedFund) {
          setFund(fetchedFund);
        } else {
          toast({ title: translations.errorTitle, description: "Savings fund not found.", variant: "destructive" });
          router.push("/savings-funds");
        }
      } catch (error) {
        toast({ title: translations.errorTitle, description: "Failed to load savings fund data.", variant: "destructive" });
        router.push("/savings-funds");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, dbUser, router, toast, translations]);

  const handleFormSubmit = async (values: SavingsFundFormSubmitValues) => {
    if (!dbUser || !fund) return;

    // Convert Date to ISO string for the action
    const formattedValues = {
      name: values.name,
      description: values.description,
      targetAmount: values.targetAmount,
      targetDate: values.targetDate ? values.targetDate.toISOString() : undefined,
    };

    const result = await updateSavingsFund(fund.id, formattedValues as any);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.savingsFundUpdatedSuccess });
      router.push("/savings-funds");
    }
  };

  if (isLoading || !fund) {
    return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.editSavingsFund} backHref="/savings-funds">
      <SavingsFundForm
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/savings-funds")}
        initialData={fund}
      />
    </FormPageLayout>
  );
}
