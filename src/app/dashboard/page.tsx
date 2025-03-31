"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loan, Payment, Customer, Interaction, FollowUp } from "@/lib/types";
import {
  loanService,
  paymentService,
  customerService,
  interactionService,
  followUpService,
} from "@/lib/api";
import { UserRole } from "@/lib/types";
import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  PhoneCall,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalCustomers: 0,
    totalPaymentsThisMonth: 0,
    paymentAmountThisMonth: 0,
    pendingLoans: 0,
    upcomingFollowUps: 0,
    overdueLoans: 0,
    recentInteractions: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get current date to filter payments this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];

        // Fetch data based on role
        const loansResponse = await loanService.getAll();
        const loans = loansResponse.results || [];

        const customersResponse = await customerService.getAll();
        const customers = customersResponse.results || [];

        const paymentsResponse = await paymentService.getAll({
          payment_date_after: startOfMonth,
          payment_date_before: endOfMonth,
        });
        const payments = paymentsResponse.results || [];

        const followUpsResponse = await followUpService.getAll({
          status: "PENDING",
          scheduled_date_after: now.toISOString().split("T")[0],
        });
        const followUps = followUpsResponse.results || [];

        const interactionsResponse = await interactionService.getAll({
          start_time_after: new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
        const interactions = interactionsResponse.results || [];

        // Calculate statistics
        const pendingLoans = loans.filter(
          (loan: Loan) => loan.status === "PENDING"
        ).length;
        const overdueLoans = loans.filter(
          (loan: Loan) => loan.days_past_due > 0
        ).length;
        const paymentAmountThisMonth = payments.reduce(
          (sum: number, payment: Payment) => sum + Number(payment.amount),
          0
        );

        setStats({
          totalLoans: loans.length,
          totalCustomers: customers.length,
          totalPaymentsThisMonth: payments.length,
          paymentAmountThisMonth,
          pendingLoans,
          upcomingFollowUps: followUps.length,
          overdueLoans,
          recentInteractions: interactions.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Determine which stats to show based on user role
  const getCardsByRole = () => {
    const isManager = [UserRole.SUPER_MANAGER, UserRole.MANAGER].includes(
      user?.role as UserRole
    );

    const allCards = [
      {
        title: "Total Loans",
        value: stats.totalLoans,
        description: "All time",
        icon: <Activity className="h-5 w-5 text-muted-foreground" />,
        color: "bg-blue-100 dark:bg-blue-950",
        roles: [UserRole.SUPER_MANAGER, UserRole.MANAGER],
      },
      {
        title: "Total Customers",
        value: stats.totalCustomers,
        description: "All time",
        icon: <Users className="h-5 w-5 text-muted-foreground" />,
        color: "bg-green-100 dark:bg-green-950",
        roles: [
          UserRole.SUPER_MANAGER,
          UserRole.MANAGER,
          UserRole.COLLECTION_OFFICER,
        ],
      },
      {
        title: "Payments This Month",
        value: stats.totalPaymentsThisMonth,
        description: `Total: $${stats.paymentAmountThisMonth.toFixed(2)}`,
        icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
        color: "bg-purple-100 dark:bg-purple-950",
        roles: [
          UserRole.SUPER_MANAGER,
          UserRole.MANAGER,
          UserRole.COLLECTION_OFFICER,
        ],
      },
      {
        title: "Pending Approvals",
        value: stats.pendingLoans,
        description: "Loans awaiting approval",
        icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
        color: "bg-amber-100 dark:bg-amber-950",
        roles: [UserRole.SUPER_MANAGER, UserRole.MANAGER],
      },
      {
        title: "Upcoming Follow-ups",
        value: stats.upcomingFollowUps,
        description: "Scheduled follow-ups",
        icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
        color: "bg-teal-100 dark:bg-teal-950",
        roles: [
          UserRole.SUPER_MANAGER,
          UserRole.MANAGER,
          UserRole.COLLECTION_OFFICER,
          UserRole.CALLING_AGENT,
        ],
      },
      {
        title: "Overdue Loans",
        value: stats.overdueLoans,
        description: "Past due date",
        icon: <Activity className="h-5 w-5 text-muted-foreground" />,
        color: "bg-red-100 dark:bg-red-950",
        roles: [
          UserRole.SUPER_MANAGER,
          UserRole.MANAGER,
          UserRole.COLLECTION_OFFICER,
        ],
      },
      {
        title: "Recent Interactions",
        value: stats.recentInteractions,
        description: "Last 7 days",
        icon: <PhoneCall className="h-5 w-5 text-muted-foreground" />,
        color: "bg-indigo-100 dark:bg-indigo-950",
        roles: [
          UserRole.SUPER_MANAGER,
          UserRole.MANAGER,
          UserRole.COLLECTION_OFFICER,
          UserRole.CALLING_AGENT,
        ],
      },
    ];

    return allCards.filter((card) =>
      card.roles.includes(user?.role as UserRole)
    );
  };

  const visibleCards = getCardsByRole();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.first_name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleCards.map((card, i) => (
          <Card key={i} className={`border-none ${card.color}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional content like recent activities, charts, etc. can be added here */}
    </div>
  );
}
