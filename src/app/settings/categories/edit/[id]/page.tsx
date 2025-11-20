"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getCategoryById, updateCategory, isCategoryInUse, deleteCategory } from "@/app/actions/categoryActions";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { EditPageLoader } from "@/components/common/EditPageLoader";
import { useTranslations } from "@/contexts/LanguageContext";
import type { Category, CategoryFormValues } from "@/types";
import { CategoryForm } from "@/components/settings/CategoryForm";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const [category, setCategory] = useState<Category | null>(null);
  const [isDeletable, setIsDeletable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      if (!user) return; // Additional check for TypeScript
      setIsLoading(true);
      try {
        const [fetchedCategory, inUse] = await Promise.all([
          getCategoryById(id, user.uid),
          isCategoryInUse(id, user.uid),
        ]);

        if (fetchedCategory) {
          if (fetchedCategory.isSystem) {
            toast({ title: translations.errorTitle, description: "System categories cannot be modified.", variant: "destructive" });
            router.push("/settings/categories");
            return;
          }
          setCategory(fetchedCategory);
          setIsDeletable(!inUse);
        } else {
          toast({ title: translations.errorTitle, description: "Category not found or you don't have permission to view it.", variant: "destructive" });
          router.push("/settings/categories");
        }
      } catch (error) {
        toast({ title: translations.errorTitle, description: "Failed to load category data.", variant: "destructive" });
        router.push("/settings/categories");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, user, router, toast, translations]);

  const handleFormSubmit = async (values: CategoryFormValues) => {
    if (!user || !category) return;

    const result = await updateCategory(category.id, values, user.uid, translations);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.categoryUpdatedSuccess });
      router.push("/settings/categories");
    }
  };

  const handleDelete = async () => {
    if (!user || !category || !isDeletable) return;

    const result = await deleteCategory(category.id, user.uid, translations);
    if (result.success) {
      toast({ title: translations.categoryDeletedSuccess, variant: 'destructive' });
      router.push("/settings/categories");
    } else {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    }
  }

  if (isLoading || !category) {
    return <EditPageLoader />;
  }

  return (
    <FormPageLayout title={translations.editCategory} backHref="/settings/categories">
      <CategoryForm
        onSubmit={handleFormSubmit}
        onClose={() => router.push("/settings/categories")}
        initialData={category}
        onDelete={handleDelete}
        isDeletable={isDeletable}
        inUseMessage={translations.categoryInUseError}
      />
    </FormPageLayout>
  );
}
