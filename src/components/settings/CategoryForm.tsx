
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect } from "react";

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
import type { Category, CategoryFormValues, Translations } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";

interface CategoryFormProps {
  onSubmit: (values: CategoryFormValues) => void;
  onClose: () => void;
  initialData?: Partial<Category>;
}

const getFormSchema = (translations: Translations) => z.object({
  name: z.string().min(1, { message: translations.categoryNameRequired }),
  isEnabled: z.boolean().default(true),
});

export function CategoryForm({ onSubmit, onClose, initialData }: CategoryFormProps) {
  const { translations } = useTranslations();
  const formSchema = getFormSchema(translations);

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

  return (
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
  );
}
