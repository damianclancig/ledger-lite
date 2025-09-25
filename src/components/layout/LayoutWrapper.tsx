
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
  
  const noHeaderFooterPages = ['/', '/goodbye', '/terms'];
  const isPublicPage = noHeaderFooterPages.includes(pathname);

  // While loading auth state, show a full-screen loader
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on a public page and there's no user, show only content.
  if (isPublicPage && !user) {
    return <main>{children}</main>;
  }
  
  // If user is logged in and tries to access a public page that is not /goodbye or /terms, redirect them.
  // This logic is handled by the AuthProvider's useEffect, so we show a loader.
  if (user && pathname === '/') {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If we are on a protected page but there is no user, show loader.
  // The AuthProvider's useEffect will handle the redirection to '/'.
  if (!user && !isPublicPage) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated (or on goodbye/terms page after action), show the main layout
  if (user || pathname === '/goodbye' || pathname === '/terms') {
    return (
      <>
        {pathname !== '/goodbye' && pathname !== '/terms' && <Header />}
        <BackgroundWrapper>
          <div className="min-h-screen flex flex-col pt-4">
            <main className="flex-grow container max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 mx-auto">
              {children}
            </main>
            <Footer />
          </div>
        </BackgroundWrapper>
      </>
    );
  }
  
  // Fallback loader
  return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
  );
}
