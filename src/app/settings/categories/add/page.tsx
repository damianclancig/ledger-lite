"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addCategory } from "@/app/actions/categoryActions";
import { CategoryForm } from "@/components/settings/CategoryForm";
import type { CategoryFormValues } from "@/types";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { useTranslations } from "@/contexts/LanguageContext";
import React from "react";

export default function AddCategoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const handleFormSubmit = async (values: CategoryFormValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addCategory(values, user.uid, translations);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.categoryAddedSuccess });
      router.push("/settings/categories");
    }
  };

  return (
    <FormPageLayout title={translations.newCategory} backHref="/settings/categories">
      <CategoryForm
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/settings/categories")}
      />
    </FormPageLayout>
  );
}
