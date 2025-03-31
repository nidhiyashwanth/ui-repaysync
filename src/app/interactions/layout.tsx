"use client";

import DashboardLayout from "@/components/dashboard-layout";

export default function InteractionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
