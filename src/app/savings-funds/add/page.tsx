"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addSavingsFund } from "@/app/actions/savingsFundActions";
import { SavingsFundForm, type SavingsFundFormSubmitValues } from "@/components/savings-funds/SavingsFundForm";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { useTranslations } from "@/contexts/LanguageContext";

export default function AddSavingsFundPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const handleFormSubmit = async (values: SavingsFundFormSubmitValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addSavingsFund(values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.savingsFundAddedSuccess });
      router.push("/savings-funds");
    }
  };

  return (
    <FormPageLayout title={translations.newSavingsFund} backHref="/savings-funds">
      <SavingsFundForm
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/savings-funds")}
      />
    </FormPageLayout>
  );
}
