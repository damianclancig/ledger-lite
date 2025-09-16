"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addTax, getUniqueTaxNames } from "@/app/actions/taxActions";
import { TaxForm, type TaxFormSubmitValues } from "@/components/taxes/TaxForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
    window.scrollTo(0, 0);
    if (!user) return;
    setIsLoading(true);
    getUniqueTaxNames(user.uid)
      .then(names => {
        // Exclude the pre-filled name from suggestions if it exists
        const filteredNames = initialData?.name ? names.filter(n => n !== initialData.name) : names;
        setTaxNames(filteredNames);
      })
      .finally(() => setIsLoading(false));
  }, [user, initialData]);

  const handleFormSubmit = async (values: TaxFormSubmitValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addTax(values, user.uid, translations);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.taxAddedTitle, description: translations.taxAddedDesc });
      router.push("/taxes");
    }
  };
  
  if (isLoading) {
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
          <CardTitle>{translations.newTax}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaxForm
            key={JSON.stringify(initialData)} // Re-mount form when initialData changes
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/taxes")}
            existingTaxNames={taxNames}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
