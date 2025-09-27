
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/contexts/LanguageContext";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmAll?: () => void;
  showInstallmentOptions?: boolean;
  title?: string;
  description?: string;
  confirmButtonText?: string;
  confirmButtonVariant?: 'default' | 'destructive';
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onConfirmAll,
  showInstallmentOptions = false,
  title,
  description,
  confirmButtonText,
  confirmButtonVariant = 'destructive',
}: DeleteConfirmationDialogProps) {
  const { translations } = useTranslations();

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || translations.confirmDelete}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {description || translations.areYouSureDelete}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="text-base">{translations.cancel}</AlertDialogCancel>
          {showInstallmentOptions && onConfirmAll ? (
            <>
              <AlertDialogAction
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(buttonVariants({ variant: 'secondary' }), 'text-base')}
              >
                {translations.deleteThisInstallment}
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  onConfirmAll();
                  onClose();
                }}
                className={cn(buttonVariants({ variant: confirmButtonVariant }), 'text-base')}
              >
                {translations.deleteAllInstallments}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(buttonVariants({ variant: confirmButtonVariant }), 'text-base')}
            >
              {confirmButtonText || translations.delete}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
