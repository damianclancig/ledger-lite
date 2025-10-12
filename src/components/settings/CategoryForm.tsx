"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import type { Category, CategoryFormValues, Translations } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";

interface CategoryFormProps {
  onSubmit: (values: CategoryFormValues) => void;
  onClose: () => void;
  initialData?: Partial<Category>;
  onDelete?: () => void;
  isDeletable?: boolean;
  inUseMessage?: string;
}

const getFormSchema = (translations: Translations) => z.object({
  name: z.string().min(1, { message: translations.categoryNameRequired }),
  isEnabled: z.boolean().default(true),
});

export function CategoryForm({ 
  onSubmit, 
  onClose, 
  initialData,
  onDelete,
  isDeletable,
  inUseMessage,
}: CategoryFormProps) {
  const { translations } = useTranslations();
  const formSchema = getFormSchema(translations);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      isEnabled: true,
      ...initialData,
    },
  });

  useEffect(() => {
    form.reset({
      name: "",
      isEnabled: true,
      ...initialData,
    });
  }, [initialData, form]);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setIsDeleteDialogOpen(false);
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.categoryName}</FormLabel>
              <FormControl>
                <Input placeholder={translations.categoryName} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>{translations.categoryStatus}</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {translations.cancel}
          </Button>
          <Button type="submit">{translations.save}</Button>
        </div>
      </form>
    </Form>

    {initialData && onDelete && (
        <div className="mt-8">
            <Separator />
            <div className="mt-6">
            {isDeletable ? (
                <div className="rounded-lg border border-destructive p-4">
                    <div className="flex items-start gap-4">
                        <div className="text-destructive mt-1">
                            <AlertTriangle className="h-5 w-5"/>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-destructive">{translations.dangerZone}</h3>
                            <p className="text-sm text-destructive/90 mt-1 mb-3">{translations.deleteCategoryWarning}</p>
                            <Button variant="destructive" onClick={handleDeleteClick}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {translations.deleteCategory}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <Alert variant="default" className="border-yellow-500/50 text-yellow-700 dark:border-yellow-500/50 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">{translations.cannotDeleteCategoryTitle}</AlertTitle>
                    <AlertDescription>
                        {inUseMessage}
                    </AlertDescription>
                </Alert>
            )}
            </div>
        </div>
    )}
     <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={translations.deleteCategory}
        description={translations.areYouSureDeleteCategory}
        confirmButtonText={translations.delete}
        confirmButtonVariant="destructive"
      />
    </>
  );
}