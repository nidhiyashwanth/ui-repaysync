"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Loan,
  LoanStatus,
  PaymentFrequency,
  UserRole,
  Payment,
} from "@/lib/types";
import { loanService } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CreditCard,
  FileEdit,
  UserRound,
  CalendarClock,
  ClipboardList,
  Phone,
  Plus,
  Pencil,
  Receipt,
  User,
  Edit,
  RefreshCcw,
  FileX2,
  Check,
} from "lucide-react";
import { PaymentsTable } from "@/components/payments/payments-table";

export default function LoanDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        setLoading(true);
        const loanData = await loanService.getById(params.id);
        setLoan(loanData);

        // Fetch payments for this loan
        const paymentsData = await loanService.getPayments(params.id);
        setPayments(paymentsData.results || []);
      } catch (error) {
        console.error("Error fetching loan details:", error);
        toast.error("Failed to load loan details");
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, [params.id]);

  // Check if user has permission to manage loans
  const canManageLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER);

  const canRecordPayment = canManageLoan;

  // Check if user can approve, restructure or write off the loan
  const canApproveLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER) &&
    loan?.status === LoanStatus.PENDING;

  const canRestructureLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER) &&
    loan?.status === LoanStatus.ACTIVE;

  const canWriteOffLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER) &&
    (loan?.status === LoanStatus.ACTIVE ||
      loan?.status === LoanStatus.DEFAULTED);

  // Helper to get a status badge
  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.PENDING:
        return <Badge variant="secondary">Pending</Badge>;
      case LoanStatus.ACTIVE:
        return <Badge>Active</Badge>;
      case LoanStatus.PAID:
        return <Badge variant="success">Paid</Badge>;
      case LoanStatus.DEFAULTED:
        return <Badge variant="destructive">Defaulted</Badge>;
      case LoanStatus.RESTRUCTURED:
        return <Badge variant="warning">Restructured</Badge>;
      case LoanStatus.WRITTEN_OFF:
        return <Badge variant="outline">Written Off</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper to display payment frequency in a readable format
  const getPaymentFrequencyText = (frequency: PaymentFrequency) => {
    switch (frequency) {
      case PaymentFrequency.DAILY:
        return "Daily";
      case PaymentFrequency.WEEKLY:
        return "Weekly";
      case PaymentFrequency.BIWEEKLY:
        return "Bi-weekly";
      case PaymentFrequency.MONTHLY:
        return "Monthly";
      case PaymentFrequency.QUARTERLY:
        return "Quarterly";
      default:
        return frequency;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Loan Details</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Loan not found or you don't have permission to view it
            </p>
            <Button asChild className="mt-4">
              <Link href="/loans">Return to Loans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {loan.loan_reference}
              {getStatusBadge(loan.status)}
            </h1>
            <p className="text-muted-foreground">
              {loan.customer_name} • {formatCurrency(loan.principal_amount)}
            </p>
          </div>
        </div>

        {canManageLoan && (
          <div className="flex gap-2">
            {canRecordPayment && (
              <Button asChild>
                <Link href={`/loans/${loan.id}/payments/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/loans/${loan.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Loan
              </Link>
            </Button>

            {canApproveLoan && (
              <Button asChild variant="default">
                <Link href={`/loans/${loan.id}/approve`}>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Link>
              </Button>
            )}

            {canRestructureLoan && (
              <Button asChild variant="outline">
                <Link href={`/loans/${loan.id}/restructure`}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Restructure
                </Link>
              </Button>
            )}

            {canWriteOffLoan && (
              <Button
                asChild
                variant="outline"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <Link href={`/loans/${loan.id}/write-off`}>
                  <FileX2 className="mr-2 h-4 w-4" />
                  Write Off
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <ClipboardList className="h-4 w-4 mr-2" />
            Loan Details
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="customer">
            <UserRound className="h-4 w-4 mr-2" />
            Customer Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
              <CardDescription>
                Details about the loan terms and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Loan Reference
                    </h3>
                    <p className="font-medium">{loan.loan_reference}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </h3>
                    <p>{getStatusBadge(loan.status)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Customer
                    </h3>
                    <p className="font-medium">
                      <Link
                        href={`/customers/${loan.customer}`}
                        className="hover:underline text-primary"
                      >
                        {loan.customer_name}
                      </Link>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Principal Amount
                    </h3>
                    <p className="font-medium">
                      {formatCurrency(loan.principal_amount)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Interest Rate
                    </h3>
                    <p className="font-medium">{loan.interest_rate}%</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Term
                    </h3>
                    <p className="font-medium">{loan.term_months} months</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Payment Frequency
                    </h3>
                    <p className="font-medium">
                      {getPaymentFrequencyText(loan.payment_frequency)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Total Amount Due
                    </h3>
                    <p className="font-medium">
                      {formatCurrency(loan.total_amount_due)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Amount Paid
                    </h3>
                    <p className="font-medium">
                      {formatCurrency(loan.amount_paid)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Remaining Balance
                    </h3>
                    <p className="font-medium">
                      {formatCurrency(loan.remaining_balance)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Days Past Due
                    </h3>
                    <p className="font-medium">
                      {loan.days_past_due > 0 ? (
                        <span className="text-destructive">
                          {loan.days_past_due} days
                        </span>
                      ) : (
                        "0 days"
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Last Payment Date
                    </h3>
                    <p className="font-medium">
                      {formatDate(loan.last_payment_date)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Assigned Officer
                    </h3>
                    <p className="font-medium">
                      {loan.assigned_officer_name || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Important Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <h4 className="text-xs text-muted-foreground">
                      Application Date
                    </h4>
                    <p className="text-sm">
                      {formatDate(loan.application_date)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs text-muted-foreground">
                      Approval Date
                    </h4>
                    <p className="text-sm">{formatDate(loan.approval_date)}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-muted-foreground">
                      Disbursement Date
                    </h4>
                    <p className="text-sm">
                      {formatDate(loan.disbursement_date)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs text-muted-foreground">
                      First Payment Date
                    </h4>
                    <p className="text-sm">
                      {formatDate(loan.first_payment_date)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs text-muted-foreground">
                      Maturity Date
                    </h4>
                    <p className="text-sm">{formatDate(loan.maturity_date)}</p>
                  </div>
                </div>
              </div>

              {loan.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Notes
                  </h3>
                  <p className="text-sm whitespace-pre-line">{loan.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    Record of all payments made for this loan
                  </CardDescription>
                </div>
                {canRecordPayment && (
                  <Button asChild>
                    <Link href={`/loans/${loan.id}/payments/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Record Payment
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <p className="text-muted-foreground">
                    No payments have been recorded yet
                  </p>
                  {canRecordPayment && (
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/loans/${loan.id}/payments/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record First Payment
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <PaymentsTable payments={payments} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                <CardTitle>Payment Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Total Amount Due
                  </h3>
                  <p className="text-lg">
                    {formatCurrency(loan.total_amount_due)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Amount Paid
                  </h3>
                  <p className="text-lg text-green-600">
                    {formatCurrency(loan.amount_paid)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Remaining Balance
                  </h3>
                  <p className="text-lg font-semibold">
                    {formatCurrency(loan.remaining_balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Details about the loan customer
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/customers/${loan.customer}`}>
                  <UserRound className="mr-2 h-4 w-4" />
                  View Full Profile
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Personal Details</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32 text-sm text-muted-foreground">
                        Name:
                      </span>
                      <span className="text-sm font-medium">
                        {loan.customer_name}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm text-muted-foreground">
                        ID:
                      </span>
                      <span className="text-sm font-medium">
                        {loan.customer}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <Link href={`/customers/${loan.customer}`}>
                    <UserRound className="mr-2 h-4 w-4" />
                    View Customer Details
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <Link
                    href={`/interactions/new?customer=${loan.customer}&loan=${loan.id}`}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Log Interaction
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <Link
                    href={`/follow-ups/new?customer=${loan.customer}&loan=${loan.id}`}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Schedule Follow-up
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
