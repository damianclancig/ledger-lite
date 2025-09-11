
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getCategories, updateCategory } from "@/app/actions";
import type { Category } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

export default function ManageCategoriesPage() {
  const { user } = useAuth();
  const { translations } = useTranslations();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadCategories() {
      setIsLoading(true);
      const userCategories = await getCategories(user.uid);
      setCategories(userCategories);
      setIsLoading(false);
    }
    loadCategories();
  }, [user]);

  const handleEditClick = (category: Category) => {
    router.push(`/settings/categories/edit/${category.id}`);
  };

  const handleToggleEnabled = async (category: Category) => {
    if (!user) return;
    const result = await updateCategory(category.id, { name: category.name, isEnabled: !category.isEnabled }, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.categoryUpdatedSuccess });
      const userCategories = await getCategories(user.uid);
      setCategories(userCategories);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const renderMobileView = () => (
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.id} className="shadow-lg border-2 border-primary/20 overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <span className="font-medium text-base pr-4 block">{category.name}</span>
              <Separator />
              <div className="flex items-center justify-between pt-1">
                <Switch
                  checked={category.isEnabled}
                  onCheckedChange={() => handleToggleEnabled(category)}
                  aria-label={`Toggle category ${category.name}`}
                />
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditClick(category)}>
                    <Edit className="h-5 w-5" />
                 </Button>
              </div>
            </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{translations.categoryName}</TableHead>
          <TableHead className="text-center">{translations.categoryStatus}</TableHead>
          <TableHead className="text-right">{translations.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium text-base">{category.name}</TableCell>
            <TableCell className="text-center">
              <Switch
                checked={category.isEnabled}
                onCheckedChange={() => handleToggleEnabled(category)}
                aria-label={`Toggle category ${category.name}`}
              />
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <List className="h-6 w-6 mr-3 text-primary" />
                <CardTitle>{translations.manageCategories}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isMobile ? renderMobileView() : renderDesktopView()}
        </CardContent>
      </Card>
    </>
  );
}
