"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface EditPageLoaderProps {
    backButton?: boolean;
}

export function EditPageLoader({ backButton = true }: EditPageLoaderProps) {
  return (
    <div className="max-w-2xl mx-auto">
        {backButton && <div className="flex justify-end mb-4"><Skeleton className="h-10 w-24" /></div>}
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
