
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User, type AuthError } from "firebase/auth";
import { app, googleProvider } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "./LanguageContext";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const auth = getAuth(app);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { translations } = useTranslations();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
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

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  }, [router, toast, translations]);
  
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, [router]);
  
   useEffect(() => {
    if (!loading) {
      const isPublicPage = ['/', '/goodbye'].includes(pathname);
      if (!user && !isPublicPage) {
        router.push('/');
      }
      if (user && isPublicPage) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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
