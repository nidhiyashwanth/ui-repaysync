"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Loan, LoanStatus, UserRole } from "@/lib/types";
import { loanService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart,
  PieChart,
  FileText,
  CreditCard,
  TrendingUp,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Chart components placeholder (you would implement with a real chart library)
const LoansByStatusChart = ({ data }: { data: any }) => (
  <div className="h-80 w-full flex items-center justify-center border rounded-md p-4">
    <div className="text-center">
      <PieChart className="h-10 w-10 text-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">
        Loan distribution by status chart would go here
      </p>
    </div>
  </div>
);

const MonthlyDisbursementChart = ({ data }: { data: any }) => (
  <div className="h-80 w-full flex items-center justify-center border rounded-md p-4">
    <div className="text-center">
      <BarChart className="h-10 w-10 text-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">
        Monthly loan disbursement chart would go here
      </p>
    </div>
  </div>
);

export default function LoanReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalActiveLoans: 0,
    totalActiveLoanAmount: 0,
    totalPaidLoans: 0,
    totalPaidAmount: 0,
    totalDefaultedLoans: 0,
    totalDefaultedAmount: 0,
    totalPendingLoans: 0,
    totalPendingAmount: 0,
    averageLoanAmount: 0,
    averageInterestRate: 0,
  });
  const [timeframe, setTimeframe] = useState("all");

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true);

        // Fetch all loans to calculate statistics
        const response = await loanService.getAll({ page_size: 1000 });
        const allLoans = response.results;
        setLoans(allLoans);

        // Calculate summary statistics
        calculateSummaryStats(allLoans);
      } catch (error) {
        console.error("Error fetching loan data:", error);
        toast.error("Failed to load loan reports");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const calculateSummaryStats = (loans: Loan[]) => {
    let activeLoans = 0;
    let activeLoanAmount = 0;
    let paidLoans = 0;
    let paidAmount = 0;
    let defaultedLoans = 0;
    let defaultedAmount = 0;
    let pendingLoans = 0;
    let pendingAmount = 0;
    let totalAmount = 0;
    let totalInterestRate = 0;

    loans.forEach((loan) => {
      totalAmount += loan.principal_amount;
      totalInterestRate += loan.interest_rate;

      switch (loan.status) {
        case LoanStatus.ACTIVE:
          activeLoans++;
          activeLoanAmount += loan.principal_amount;
          break;
        case LoanStatus.PAID:
          paidLoans++;
          paidAmount += loan.principal_amount;
          break;
        case LoanStatus.DEFAULTED:
          defaultedLoans++;
          defaultedAmount += loan.principal_amount;
          break;
        case LoanStatus.PENDING:
          pendingLoans++;
          pendingAmount += loan.principal_amount;
          break;
      }
    });

    setSummaryStats({
      totalActiveLoans: activeLoans,
      totalActiveLoanAmount: activeLoanAmount,
      totalPaidLoans: paidLoans,
      totalPaidAmount: paidAmount,
      totalDefaultedLoans: defaultedLoans,
      totalDefaultedAmount: defaultedAmount,
      totalPendingLoans: pendingLoans,
      totalPendingAmount: pendingAmount,
      averageLoanAmount: loans.length > 0 ? totalAmount / loans.length : 0,
      averageInterestRate:
        loans.length > 0 ? totalInterestRate / loans.length : 0,
    });
  };

  const filterByTimeframe = (selectedTimeframe: string) => {
    setTimeframe(selectedTimeframe);

    // In a real implementation, you would:
    // 1. Either filter the existing loans array by date
    // 2. Or make a new API call with date filters
    // Then recalculate statistics

    toast.info(`Filtering by ${selectedTimeframe}`);
  };

  // Check if user has permission to view reports
  const canViewReports =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER);

  if (!canViewReports) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Loan Reports</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You don't have permission to view loan reports
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Loan Reports</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
            <Skeleton className="h-80 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Loan Reports</h1>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select defaultValue={timeframe} onValueChange={filterByTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Loans Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">
                  {summaryStats.totalActiveLoans}
                </p>
                <p className="text-sm text-muted-foreground">loans</p>
              </div>
              <p className="text-muted-foreground">
                {formatCurrency(summaryStats.totalActiveLoanAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Paid Loans Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">
                  {summaryStats.totalPaidLoans}
                </p>
                <p className="text-sm text-muted-foreground">loans</p>
              </div>
              <p className="text-muted-foreground">
                {formatCurrency(summaryStats.totalPaidAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Defaulted Loans Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Defaulted Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">
                  {summaryStats.totalDefaultedLoans}
                </p>
                <p className="text-sm text-muted-foreground">loans</p>
              </div>
              <p className="text-muted-foreground">
                {formatCurrency(summaryStats.totalDefaultedAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Average Loan Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">
                  {formatCurrency(summaryStats.averageLoanAmount)}
                </p>
              </div>
              <p className="text-muted-foreground">
                {summaryStats.averageInterestRate.toFixed(2)}% interest rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">
            <PieChart className="h-4 w-4 mr-2" />
            By Status
          </TabsTrigger>
          <TabsTrigger value="disbursements">
            <BarChart className="h-4 w-4 mr-2" />
            Disbursements
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Distribution by Status</CardTitle>
              <CardDescription>
                Breakdown of loans by their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoansByStatusChart data={loans} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Metrics</CardTitle>
              <CardDescription>Detailed metrics by loan status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium">Active Loans</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Currently outstanding loans
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Count:
                      </span>
                      <span>{summaryStats.totalActiveLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Value:
                      </span>
                      <span>
                        {formatCurrency(summaryStats.totalActiveLoanAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        % of Total:
                      </span>
                      <span>
                        {loans.length > 0
                          ? (
                              (summaryStats.totalActiveLoans / loans.length) *
                              100
                            ).toFixed(2)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Paid Loans</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Successfully completed loans
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Count:
                      </span>
                      <span>{summaryStats.totalPaidLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Value:
                      </span>
                      <span>
                        {formatCurrency(summaryStats.totalPaidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        % of Total:
                      </span>
                      <span>
                        {loans.length > 0
                          ? (
                              (summaryStats.totalPaidLoans / loans.length) *
                              100
                            ).toFixed(2)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Defaulted Loans</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Loans in default
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Count:
                      </span>
                      <span>{summaryStats.totalDefaultedLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Value:
                      </span>
                      <span>
                        {formatCurrency(summaryStats.totalDefaultedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        % of Total:
                      </span>
                      <span>
                        {loans.length > 0
                          ? (
                              (summaryStats.totalDefaultedLoans /
                                loans.length) *
                              100
                            ).toFixed(2)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disbursements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Loan Disbursements</CardTitle>
              <CardDescription>
                Amount disbursed in loans by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyDisbursementChart data={loans} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Performance</CardTitle>
              <CardDescription>
                Performance metrics for the loan portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center p-12 text-center">
                <div>
                  <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Coming Soon</h3>
                  <p className="text-muted-foreground mt-2">
                    Loan performance analytics are currently being developed.
                    <br />
                    Check back soon for detailed insights into your loan
                    portfolio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
