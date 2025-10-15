
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
  
  const publicPagesWithLayout = ['/terms'];
  const pagesWithOwnLayout = ['/', '/goodbye', '/welcome', '/login'];
  
  const isPublicPageWithLayout = publicPagesWithLayout.includes(pathname);
  const hasOwnLayout = pagesWithOwnLayout.includes(pathname);

  // While loading auth state, show a full-screen loader
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render pages with completely custom layouts (like login, goodbye)
  if (hasOwnLayout && !user) {
    return <main>{children}</main>;
  }

  // If user is authenticated, or if it's a public page that uses the main layout
  if (user || isPublicPageWithLayout) {
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

  // If we are on a protected page but there is no user, show a loader.
  // The AuthProvider's useEffect will handle the redirection to the login page.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
