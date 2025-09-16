"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getCategoryById, updateCategory } from "@/app/actions/categoryActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, CategoryFormValues } from "@/types";
import { Separator } from "@/components/ui/separator";
import { CategoryForm } from "@/components/settings/CategoryForm";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();
  
  const [category, setCategory] = useState<Category | null>(null);
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
        const fetchedCategory = await getCategoryById(id, user.uid);
        
        if (fetchedCategory) {
          if (fetchedCategory.isSystem) {
            toast({ title: translations.errorTitle, description: "System categories cannot be modified.", variant: "destructive" });
            router.push("/settings/categories");
            return;
          }
          setCategory(fetchedCategory);
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

    const result = await updateCategory(category.id, values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.categoryUpdatedSuccess });
      router.push("/settings/categories");
    }
  };
  
  if (isLoading || !category) {
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
            <Link href="/settings/categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.back}
            </Link>
        </Button>
      </div>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="p-4 pb-2">
          <CardTitle>{translations.editCategory}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <CategoryForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/settings/categories")}
            initialData={category}
          />
        </CardContent>
      </Card>
    </div>
  );
}
