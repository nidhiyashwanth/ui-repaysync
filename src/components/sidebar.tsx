"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { UserRole } from "@/lib/types";

import {
  LayoutDashboard,
  Users,
  Network,
  UserCheck,
  FileSpreadsheet,
  CreditCard,
  Phone,
  CalendarClock,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

// Define types for menu items
interface SubMenuItem {
  title: string;
  href: string;
  roles: UserRole[];
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  subItems?: SubMenuItem[];
}

const Sidebar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(window.innerWidth >= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: [
        UserRole.SUPER_MANAGER,
        UserRole.MANAGER,
        UserRole.COLLECTION_OFFICER,
        UserRole.CALLING_AGENT,
      ],
    },
    {
      title: "Users",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      roles: [UserRole.SUPER_MANAGER, UserRole.MANAGER],
    },
    {
      title: "Hierarchies",
      href: "/hierarchies",
      icon: <Network className="h-5 w-5" />,
      roles: [UserRole.SUPER_MANAGER, UserRole.MANAGER],
    },
    // {
    //   title: "Groups",
    //   href: "/groups",
    //   icon: <Users className="h-5 w-5" />,
    //   roles: [UserRole.SUPER_MANAGER],
    // },
    {
      title: "Customers",
      href: "/customers",
      icon: <UserCheck className="h-5 w-5" />,
      roles: [
        UserRole.SUPER_MANAGER,
        UserRole.MANAGER,
        UserRole.COLLECTION_OFFICER,
        UserRole.CALLING_AGENT,
      ],
    },
    {
      title: "Loans",
      href: "/loans",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      roles: [
        UserRole.SUPER_MANAGER,
        UserRole.MANAGER,
        UserRole.COLLECTION_OFFICER,
        UserRole.CALLING_AGENT,
      ],
      subItems: [
        {
          title: "All Loans",
          href: "/loans",
          roles: [
            UserRole.SUPER_MANAGER,
            UserRole.MANAGER,
            UserRole.COLLECTION_OFFICER,
            UserRole.CALLING_AGENT,
          ],
        },
        {
          title: "New Loan",
          href: "/loans/new",
          roles: [
            UserRole.SUPER_MANAGER,
            UserRole.MANAGER,
            UserRole.COLLECTION_OFFICER,
          ],
        },
        {
          title: "Loan Reports",
          href: "/reports/loans",
          roles: [UserRole.SUPER_MANAGER, UserRole.MANAGER],
        },
      ],
    },
    // {
    //   title: "Payments",
    //   href: "/payments",
    //   icon: <CreditCard className="h-5 w-5" />,
    //   roles: [
    //     UserRole.SUPER_MANAGER,
    //     UserRole.MANAGER,
    //     UserRole.COLLECTION_OFFICER,
    //   ],
    // },
    {
      title: "Interactions",
      href: "/interactions",
      icon: <Phone className="h-5 w-5" />,
      roles: [
        UserRole.SUPER_MANAGER,
        UserRole.MANAGER,
        UserRole.COLLECTION_OFFICER,
        UserRole.CALLING_AGENT,
      ],
    },
    {
      title: "Follow-ups",
      href: "/follow-ups",
      icon: <CalendarClock className="h-5 w-5" />,
      roles: [
        UserRole.SUPER_MANAGER,
        UserRole.MANAGER,
        UserRole.COLLECTION_OFFICER,
        UserRole.CALLING_AGENT,
      ],
    },
    // {
    //   title: "Reports",
    //   href: "/reports",
    //   icon: <BarChart className="h-5 w-5" />,
    //   roles: [UserRole.SUPER_MANAGER, UserRole.MANAGER],
    // },
    // {
    //   title: "Settings",
    //   href: "/settings",
    //   icon: <Settings className="h-5 w-5" />,
    //   roles: [
    //     UserRole.SUPER_MANAGER,
    //     UserRole.MANAGER,
    //     UserRole.COLLECTION_OFFICER,
    //   ],
    // },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-background border-r border-border transition-transform duration-300 ease-in-out transform",
          isMobile && !isOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col flex-1 h-0 overflow-y-auto">
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b border-border">
            <h1 className="text-xl font-semibold text-foreground">RepaySync</h1>
          </div>

          <div className="flex-1 px-3 py-4 space-y-1">
            {menuItems
              .filter((item) => item.roles.includes(user.role))
              .map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      (pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)) &&
                        !(item.subItems && pathname.startsWith(`${item.href}/`))
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>

                  {/* Sub-items */}
                  {item.subItems && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.subItems
                        .filter((subItem) => subItem.roles.includes(user.role))
                        .map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                              pathname === subItem.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <span>{subItem.title}</span>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* User Info */}
          <div className="flex flex-col py-4 px-3 border-t border-border space-y-2">
            <div className="px-3 py-2">
              <div className="font-medium text-sm">{`${user.first_name} ${user.last_name}`}</div>
              <div className="text-xs text-muted-foreground">
                {user.role.replace("_", " ")}
              </div>
            </div>
            <Button
              variant="ghost"
              className="flex items-center px-3 py-2 text-sm justify-start"
              onClick={logout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Log out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
