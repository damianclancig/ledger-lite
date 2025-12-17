
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User as FirebaseUser, type AuthError } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "./LanguageContext";
import { syncUser } from "@/app/actions/authActions";
import type { User } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: (redirectPath?: string, options?: { noRedirect?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { useAuthState } from "@/hooks/useAuthState";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: firebaseLoading, setUser } = useAuthState();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const handleAuthError = (error: AuthError) => {
    if (error.code === 'auth/unauthorized-domain') {
      toast({
        title: translations.errorTitle,
        description: translations.unauthorizedDomainError,
        variant: "destructive",
        duration: 15000,
      });
    } else if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
      console.error("Error during sign in", error);
      toast({ title: translations.errorTitle, description: error.message, variant: "destructive" });
    }
  };


  useEffect(() => {
    const performSync = async () => {
      if (user) {
        setIsSyncing(true);
        try {
          const token = await user.getIdToken();
          const result = await syncUser(token);
          if (result.success && result.user) {
            setDbUser(result.user);
          } else {
            console.error("Failed to sync user:", result.error);
            toast({
              title: translations.errorTitle,
              description: `Sync failed: ${result.error}`,
              variant: "destructive"
            });
          }
        } catch (err) {
          console.error("Sync user error:", err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setDbUser(null);
      }
    };

    performSync();
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      // The useEffect will handle syncing
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  }, [setUser, toast, translations]);

  const signOut = useCallback(async (redirectPath: string = '/', options: { noRedirect?: boolean } = {}) => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setDbUser(null);
      if (!options.noRedirect) {
        router.push(redirectPath);
      }
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, [setUser, router]);

  return (
    <AuthContext.Provider value={{ user, dbUser, loading: firebaseLoading || isSyncing, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

