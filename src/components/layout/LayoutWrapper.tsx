"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { BackgroundWrapper } from "./BackgroundWrapper";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, user } = useAuth();
  const isLoginPage = pathname === '/login';

  // While loading auth state, show a full-screen loader
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on the login page, render only the children without header/main wrappers
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // If we are not on login page, but there's no user, we are in a redirect state.
  // The AuthProvider's useEffect is handling the redirect. Show a loader to prevent flicker.
  if (!user && !isLoginPage) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, show the main layout
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <BackgroundWrapper>
        <main className="flex-grow container max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </BackgroundWrapper>
      <Footer />
    </div>
  );
}
