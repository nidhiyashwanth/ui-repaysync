"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/components/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Skeleton sidebar */}
        <div className="fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border">
          <div className="h-16 border-b border-border flex items-center justify-center">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>

        {/* Skeleton content */}
        <div className="flex-1 ml-64 p-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        <main className="p-4 md:p-8">{children}</main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
