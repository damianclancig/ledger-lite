"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const protectedRoutes = [
    '/dashboard',
    '/add-transaction', '/edit-transaction',
    '/taxes', '/add-tax', '/edit-tax',
    '/installments', '/edit-installment-purchase',
    '/savings-funds', '/savings-funds/add', '/savings-funds/edit',
    '/settings',
    '/card-summaries'
];

const unmanagedRoutes = ['/', '/login', '/goodbye', '/welcome', '/terms'];

export const useProtectedRoute = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (unmanagedRoutes.includes(pathname) || pathname.startsWith('/settings/account')) {
        return;
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (!user && isProtectedRoute) {
      router.push('/');
    } else if (user && pathname === '/') {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);
};
