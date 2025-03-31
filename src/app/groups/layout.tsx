import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups | RepaySync",
  description: "Manage user groups and permissions",
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}