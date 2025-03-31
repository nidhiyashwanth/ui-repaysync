"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Loan, LoanStatus, UserRole } from "@/lib/types";
import { loanService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Define form validation schema
const formSchema = z.object({
  new_maturity_date: z.date({
    required_error: "New maturity date is required",
  }),
  new_interest_rate: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  notes: z.string().optional(),
});

export default function RestructureLoanPage({
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
      new_maturity_date: new Date(),
      new_interest_rate: "",
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

        // Set default maturity date from loan if available
        if (loanData.maturity_date) {
          const maturityDate = new Date(loanData.maturity_date);
          // Add 30 days as a default for new maturity date
          maturityDate.setDate(maturityDate.getDate() + 30);
          form.setValue("new_maturity_date", maturityDate);
        }

        // Set default interest rate
        if (loanData.interest_rate) {
          form.setValue("new_interest_rate", loanData.interest_rate.toString());
        }
      } catch (error) {
        console.error("Error fetching loan data:", error);
        toast.error("Failed to load loan data");
        router.push(`/loans/${params.id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Format dates to strings
      const payload = {
        ...values,
        new_maturity_date: format(values.new_maturity_date, "yyyy-MM-dd"),
      };

      // Restructure loan via API
      await loanService.restructure(params.id, payload);
      toast.success("Loan restructured successfully");
      router.push(`/loans/${params.id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to restructure loan";
      toast.error(errorMessage);
      console.error("Error restructuring loan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to restructure loans
  const canRestructureLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER) &&
    loan?.status === LoanStatus.ACTIVE;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Restructure Loan</h1>
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

  if (!canRestructureLoan || !loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Restructure Loan</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!loan
                ? "Loan not found"
                : loan.status !== LoanStatus.ACTIVE
                ? "Only active loans can be restructured"
                : "You don't have permission to restructure loans"}
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
        <h1 className="text-3xl font-bold">Restructure Loan</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-6 w-6 text-primary" />
                <CardTitle>Loan Summary</CardTitle>
              </div>
              <CardDescription>
                Current loan details for reference
              </CardDescription>
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
                  <p>{formatCurrency(loan.remaining_balance)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Interest Rate
                  </p>
                  <p>{loan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Maturity Date
                  </p>
                  <p>
                    {loan.maturity_date
                      ? format(new Date(loan.maturity_date), "PPP")
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restructure Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-6 w-6 text-primary" />
                <CardTitle>Restructure Information</CardTitle>
              </div>
              <CardDescription>Enter new loan terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Maturity Date */}
              <FormField
                control={form.control}
                name="new_maturity_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>New Maturity Date *</FormLabel>
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
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The new maturity date for the loan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Interest Rate */}
              <FormField
                control={form.control}
                name="new_interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave blank to keep current interest rate
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
                        placeholder="Reason for restructuring the loan"
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
                onClick={() => router.push(`/loans/${params.id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Restructure Loan"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
