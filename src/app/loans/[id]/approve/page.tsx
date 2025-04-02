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
import { ArrowLeft, Check, Calendar } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

// Define form validation schema
const formSchema = z.object({
  approval_date: z.date({
    required_error: "Approval date is required",
  }),
  disbursement_date: z.date({
    required_error: "Disbursement date is required",
  }),
  notes: z.string().optional(),
});

export default function ApproveLoanPage({
  params,
}: {
  params: { id: string };
}) {
  // Use React.use to resolve the params promise
  const resolvedParams = React.use(params);
  const loanId = resolvedParams.id;

  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      approval_date: new Date(),
      disbursement_date: new Date(),
      notes: "",
    },
  });

  // Fetch loan data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch the loan
        const loanData = await loanService.getById(loanId);
        setLoan(loanData);
      } catch (error) {
        console.error("Error fetching loan data:", error);
        toast.error("Failed to load loan data");
        router.push(`/loans/${loanId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loanId, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Format dates to strings
      const payload = {
        ...values,
        approval_date: format(values.approval_date, "yyyy-MM-dd"),
        disbursement_date: format(values.disbursement_date, "yyyy-MM-dd"),
      };

      // Approve loan via API
      await loanService.approve(loanId, payload);
      toast.success("Loan approved successfully");
      router.push(`/loans/${loanId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to approve loan";
      toast.error(errorMessage);
      console.error("Error approving loan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to approve loans
  const canApproveLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER) &&
    loan?.status === LoanStatus.PENDING;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${loanId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Approve Loan</h1>
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

  if (!canApproveLoan || !loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${loanId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Approve Loan</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!loan
                ? "Loan not found"
                : loan.status !== LoanStatus.PENDING
                ? "Only pending loans can be approved"
                : "You don't have permission to approve loans"}
            </p>
            <Button asChild className="mt-4">
              <Link href={`/loans/${loanId}`}>Return to Loan Details</Link>
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
          <Link href={`/loans/${loanId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Approve Loan</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Check className="h-6 w-6 text-primary" />
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
                    Interest Rate
                  </p>
                  <p>{loan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Term
                  </p>
                  <p>{loan.term_months} months</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Payment Frequency
                  </p>
                  <p>{loan.payment_frequency_display}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <CardTitle>Approval Information</CardTitle>
              </div>
              <CardDescription>
                Enter approval and disbursement details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Approval Date */}
              <FormField
                control={form.control}
                name="approval_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Approval Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Date when the loan is being approved
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Disbursement Date */}
              <FormField
                control={form.control}
                name="disbursement_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Disbursement Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Date when funds will be disbursed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional comments about this approval"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push(`/loans/${loanId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Approve Loan"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
