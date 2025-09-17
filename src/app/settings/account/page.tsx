"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { deleteUserAccount } from "@/app/actions/userActions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth();
  const { translations } = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    const result = await deleteUserAccount(user.uid);
    if (result.success) {
      await signOut(); // This clears the client-side session
      router.push('/goodbye'); // Redirect to the new farewell page
    } else {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setConfirmationText(""); // Reset text when dialog opens
    }
    setIsDialogOpen(open);
  }

  const isDeleteButtonDisabled = confirmationText !== translations.deleteAccountConfirmationWord || isDeleting;

  return (
    <>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <div className="flex items-center">
            <User className="h-6 w-6 mr-3 text-primary" />
            <CardTitle>{translations.accountSettings}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-lg">{user?.displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card className="shadow-xl border-2 border-destructive">
        <CardHeader>
          <div className="flex items-center text-destructive">
            <AlertTriangle className="h-6 w-6 mr-3" />
            <CardTitle>{translations.dangerZone}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">
            {translations.deleteAccountWarning}
          </CardDescription>
           <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? "Eliminando..." : translations.deleteAccount}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{translations.deleteAccountConfirmation}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="text-base space-y-4">
                    <span>{translations.deleteAccountWarning}</span>
                    <div className="text-left pt-2">
                        <Label htmlFor="delete-confirmation-input" className="mb-2 text-foreground font-medium block">{translations.deleteAccountInputPrompt}</Label>
                        <Input
                          id="delete-confirmation-input"
                          type="text"
                          value={confirmationText}
                          onChange={(e) => setConfirmationText(e.target.value)}
                          placeholder={translations.deleteAccountConfirmationWord}
                          className="border-destructive focus-visible:ring-destructive"
                          autoComplete="off"
                        />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleDeleteAccount}
                  disabled={isDeleteButtonDisabled}
                >
                  {isDeleting ? "Eliminando..." : translations.deleteAccount}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
