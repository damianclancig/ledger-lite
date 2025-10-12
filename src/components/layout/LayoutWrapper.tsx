
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
  
  const publicPages = ['/']; 
  const pagesWithOwnLayout = ['/goodbye', '/terms', '/welcome', '/login'];
  
  const isPublicPage = publicPages.includes(pathname);
  const hasOwnLayout = pagesWithOwnLayout.includes(pathname);

  // While loading auth state, show a full-screen loader
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (hasOwnLayout || (isPublicPage && !user)) {
    return <main>{children}</main>;
  }
  
  // If we are on a protected page but there is no user, show a loader.
  // The AuthProvider's useEffect will handle the redirection.
  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we've reached this point, the user is authenticated and is on a protected page.
  // Show the main layout with Header and Footer.
  return (
    <>
      <Header />
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
