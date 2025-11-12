
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User, type AuthError } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "./LanguageContext";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: (redirectPath?: string, options?: { noRedirect?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      // Successful sign-in is handled by onAuthStateChanged, which will trigger the useEffect below
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  }, [toast, translations]);
  
  const signOut = useCallback(async (redirectPath: string = '/', options: { noRedirect?: boolean } = {}) => {
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will set the user to null.
      // We handle redirection here to make it predictable.
      if (!options.noRedirect) {
          router.push(redirectPath);
      }
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, [router]);
  
   useEffect(() => {
    if (loading) return;

    const protectedRoutes = [
        '/dashboard', 
        '/add-transaction', '/edit-transaction', 
        '/taxes', '/add-tax', '/edit-tax',
        '/installments', '/edit-installment-purchase',
        '/savings-funds', '/savings-funds/add', '/savings-funds/edit',
        '/settings'
    ];
    
    // Pages that manage their own layout or are public
    const unmanagedRoutes = ['/', '/login', '/goodbye', '/welcome', '/terms'];

    // Don't interfere with unmanaged routes
    if (unmanagedRoutes.includes(pathname)) {
        return;
    }
    
    // Exception for the account deletion flow
    if (pathname.startsWith('/settings/account')) {
        return;
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (!user && isProtectedRoute) {
      router.push('/');
    } else if (user && pathname === '/') {
      // If a logged-in user lands on the homepage, redirect to dashboard
      router.push('/dashboard');
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
