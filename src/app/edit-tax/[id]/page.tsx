"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getTaxById, updateTax, getUniqueTaxNames } from "@/app/actions/taxActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
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
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
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
          // Exclude the current tax name from suggestions for itself
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
    return (
       <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
             <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
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
            <Link href="/taxes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.back}
            </Link>
        </Button>
      </div>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <CardTitle>{translations.editTax}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaxForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/taxes")}
            initialData={tax}
            existingTaxNames={taxNames}
          />
        </CardContent>
      </Card>
    </div>
  );
}
