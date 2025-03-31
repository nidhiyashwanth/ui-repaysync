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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, FileX2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Define form validation schema
const formSchema = z.object({
  notes: z.string().min(1, "Please provide a reason for writing off this loan"),
});

export default function WriteOffLoanPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Fetch loan data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch the loan
        const loanData = await loanService.getById(params.id);
        setLoan(loanData);
      } catch (error) {
        console.error("Error fetching loan data:", error);
        toast.error("Failed to load loan data");
        router.push(`/loans/${params.id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Write off loan via API
      await loanService.writeOff(params.id, values);
      toast.success("Loan written off successfully");
      router.push(`/loans/${params.id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to write off loan";
      toast.error(errorMessage);
      console.error("Error writing off loan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to write off loans
  const canWriteOffLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER) &&
    (loan?.status === LoanStatus.ACTIVE ||
      loan?.status === LoanStatus.DEFAULTED);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Write Off Loan</h1>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-20 mr-2" />
            <Skeleton className="h-10 w-20" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!canWriteOffLoan || !loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Write Off Loan</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!loan
                ? "Loan not found"
                : loan.status !== LoanStatus.ACTIVE &&
                  loan.status !== LoanStatus.DEFAULTED
                ? "Only active or defaulted loans can be written off"
                : "You don't have permission to write off loans"}
            </p>
            <Button asChild className="mt-4">
              <Link href={`/loans/${params.id}`}>Return to Loan Details</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/loans/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Write Off Loan</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileX2 className="h-6 w-6 text-primary" />
                <CardTitle>Loan Summary</CardTitle>
              </div>
              <CardDescription>Loan details for reference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer
                  </p>
                  <p>{loan.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reference
                  </p>
                  <p>{loan.loan_reference}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Principal Amount
                  </p>
                  <p>{formatCurrency(loan.principal_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Remaining Balance
                  </p>
                  <p className="font-medium text-destructive">
                    {formatCurrency(loan.remaining_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p>{loan.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Days Past Due
                  </p>
                  <p>
                    {loan.days_past_due > 0 ? (
                      <span className="text-destructive">
                        {loan.days_past_due} days
                      </span>
                    ) : (
                      "0 days"
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Warning</p>
                <p className="text-sm mt-1">
                  Writing off a loan means you are acknowledging that this debt
                  will not be collected. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Write-off Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileX2 className="h-6 w-6 text-primary" />
                <CardTitle>Write-off Information</CardTitle>
              </div>
              <CardDescription>
                Provide a reason for writing off this loan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notes/Reason */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Write-off *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this loan is being written off"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be recorded in the loan history
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push(`/loans/${params.id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="destructive"
              >
                {isSubmitting ? "Processing..." : "Write Off Loan"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
