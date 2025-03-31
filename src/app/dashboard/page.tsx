"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loan, Payment, Customer, Interaction, FollowUp } from "@/lib/types";
import {
  loanService,
  paymentService,
  customerService,
  interactionService,
  followUpService,
} from "@/lib/api";
import { UserRole, LoanStatus } from "@/lib/types";
import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  PhoneCall,
  BarChart,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loanStats, setLoanStats] = useState({
    activeLoans: 0,
    activeAmount: 0,
    overdueLoans: 0,
    overdueAmount: 0,
    pendingLoans: 0,
    pendingAmount: 0,
    paidLoans: 0,
    paidAmount: 0,
    totalLoans: 0,
    totalAmount: 0,
  });
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    newCustomersThisMonth: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Fetch loans data
        const loansResponse = await loanService.getAll({ page_size: 1000 });
        const loans = loansResponse.results;

        // Fetch customers data
        const customersResponse = await customerService.getAll({
          page_size: 1000,
        });
        const customers = customersResponse.results;

        // Calculate loan statistics
        const active = loans.filter(
          (loan) => loan.status === LoanStatus.ACTIVE
        );
        const paid = loans.filter((loan) => loan.status === LoanStatus.PAID);
        const pending = loans.filter(
          (loan) => loan.status === LoanStatus.PENDING
        );
        const overdue = loans.filter((loan) => loan.days_past_due > 0);

        setLoanStats({
          activeLoans: active.length,
          activeAmount: active.reduce(
            (sum, loan) => sum + loan.principal_amount,
            0
          ),
          overdueLoans: overdue.length,
          overdueAmount: overdue.reduce(
            (sum, loan) => sum + loan.remaining_balance,
            0
          ),
          pendingLoans: pending.length,
          pendingAmount: pending.reduce(
            (sum, loan) => sum + loan.principal_amount,
            0
          ),
          paidLoans: paid.length,
          paidAmount: paid.reduce(
            (sum, loan) => sum + loan.principal_amount,
            0
          ),
          totalLoans: loans.length,
          totalAmount: loans.reduce(
            (sum, loan) => sum + loan.principal_amount,
            0
          ),
        });

        // Calculate customer statistics
        const active_customers = customers.filter(
          (customer) => customer.is_active
        );

        // Calculate new customers this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newCustomers = customers.filter((customer) => {
          const createdDate = new Date(customer.created_at);
          return createdDate >= firstDayOfMonth;
        });

        setCustomerStats({
          totalCustomers: customers.length,
          activeCustomers: active_customers.length,
          inactiveCustomers: customers.length - active_customers.length,
          newCustomersThisMonth: newCustomers.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/loans/new">
              <CreditCard className="mr-2 h-4 w-4" />
              New Loan
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/customers/new">
              <Users className="mr-2 h-4 w-4" />
              New Customer
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Loans */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{loanStats.activeLoans}</p>
                <p className="text-sm text-muted-foreground">loans</p>
              </div>
              <p className="text-muted-foreground">
                {formatCurrency(loanStats.activeAmount)}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href="/loans?status=ACTIVE"
              className="text-xs text-primary hover:underline"
            >
              View active loans
            </Link>
          </CardFooter>
        </Card>

        {/* Overdue Loans */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-destructive">
                  {loanStats.overdueLoans}
                </p>
                <p className="text-sm text-muted-foreground">loans</p>
              </div>
              <p className="text-muted-foreground">
                {formatCurrency(loanStats.overdueAmount)}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href="/loans?overdue=true"
              className="text-xs text-primary hover:underline"
            >
              View overdue loans
            </Link>
          </CardFooter>
        </Card>

        {/* Customer Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">
                  {customerStats.activeCustomers}
                </p>
                <p className="text-sm text-muted-foreground">customers</p>
              </div>
              <p className="text-muted-foreground">
                {customerStats.newCustomersThisMonth} new this month
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href="/customers"
              className="text-xs text-primary hover:underline"
            >
              View all customers
            </Link>
          </CardFooter>
        </Card>

        {/* Pending Loans */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{loanStats.pendingLoans}</p>
                <p className="text-sm text-muted-foreground">loans</p>
              </div>
              <p className="text-muted-foreground">
                {formatCurrency(loanStats.pendingAmount)}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href="/loans?status=PENDING"
              className="text-xs text-primary hover:underline"
            >
              View pending loans
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loan Portfolio</CardTitle>
                <CardDescription>
                  Summary of your loan portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Loans
                      </p>
                      <p className="text-xl font-medium">
                        {loanStats.totalLoans}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Portfolio Size
                      </p>
                      <p className="text-xl font-medium">
                        {formatCurrency(loanStats.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Active Loans
                      </p>
                      <p className="text-xl font-medium">
                        {loanStats.activeLoans}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Fully Paid
                      </p>
                      <p className="text-xl font-medium">
                        {loanStats.paidLoans}
                      </p>
                    </div>
                  </div>
                  <div className="h-60 flex items-center justify-center border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Loan portfolio chart would go here
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/reports/loans">
                  <Button variant="outline">View detailed reports</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Overview</CardTitle>
                <CardDescription>
                  Customer statistics and growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Customers
                      </p>
                      <p className="text-xl font-medium">
                        {customerStats.totalCustomers}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Active Customers
                      </p>
                      <p className="text-xl font-medium">
                        {customerStats.activeCustomers}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Inactive Customers
                      </p>
                      <p className="text-xl font-medium">
                        {customerStats.inactiveCustomers}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        New This Month
                      </p>
                      <p className="text-xl font-medium">
                        {customerStats.newCustomersThisMonth}
                      </p>
                    </div>
                  </div>
                  <div className="h-60 flex items-center justify-center border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Customer growth chart would go here
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/customers">
                  <Button variant="outline">View all customers</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Loan and collection performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Coming Soon</h3>
                <p className="text-muted-foreground mt-2">
                  We're working on detailed performance metrics for your
                  portfolio.
                  <br />
                  Check back soon for insights into your loan performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
