"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addTax } from "@/app/actions";
import { TaxForm, type TaxFormSubmitValues } from "@/components/taxes/TaxForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AddTaxPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const handleFormSubmit = async (values: TaxFormSubmitValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addTax(values, user.uid);

    if (result && 'error' in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Tax record added", description: "New tax payment successfully recorded." });
      router.push("/taxes");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/taxes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translations.back}
        </Link>
      </Button>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <CardTitle>{translations.newTax}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaxForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/taxes")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
