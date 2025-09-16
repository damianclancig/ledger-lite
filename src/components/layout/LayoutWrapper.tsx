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
  const isPublicPage = ['/', '/goodbye'].includes(pathname);

  // While loading auth state, show a full-screen loader
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on a public page (home or goodbye) and there's no user, show only content.
  if (isPublicPage && !user) {
    // The goodbye page and home page now include their own Footer.
    return <main>{children}</main>;
  }
  
  // If user is logged in and tries to access a public page, redirect them.
  if (user && isPublicPage) {
    // This case is handled by the AuthProvider's useEffect, which redirects to /dashboard.
    // We still show a loader for a better UX during the quick redirect.
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

  // If user is authenticated, show the main layout with header and footer
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
