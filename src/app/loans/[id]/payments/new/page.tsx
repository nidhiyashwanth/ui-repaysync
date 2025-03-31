"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Loan, Payment, UserRole } from "@/lib/types";
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
import { ArrowLeft, Receipt } from "lucide-react";
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
  amount: z
    .string()
    .min(1, "Payment amount is required")
    .transform((val) => parseFloat(val)),
  payment_date: z.date(),
  receipt_number: z.string().optional(),
  payment_method: z.string().min(1, "Payment method is required"),
  received_by: z.string().optional(),
  notes: z.string().optional(),
});

export default function NewPaymentPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      payment_date: new Date(),
      receipt_number: "",
      payment_method: "",
      received_by: "",
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

      // Format dates to strings
      const payload = {
        ...values,
        loan: params.id,
        payment_date: format(values.payment_date, "yyyy-MM-dd"),
        received_by:
          values.received_by || user?.first_name + " " + user?.last_name,
      };

      // Record payment via API
      await loanService.recordPayment(params.id, payload);
      toast.success("Payment recorded successfully");
      router.push(`/loans/${params.id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to record payment";
      toast.error(errorMessage);
      console.error("Error recording payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to record payments
  const canRecordPayment =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Record Payment</h1>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
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

  if (!canRecordPayment || !loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Record Payment</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!loan
                ? "Loan not found"
                : "You don't have permission to record payments"}
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
        <h1 className="text-3xl font-bold">Record Payment</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                <CardTitle>Loan Summary</CardTitle>
              </div>
              <CardDescription>Loan details for reference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reference
                  </p>
                  <p>{loan.reference}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p>{loan.status}</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                <CardTitle>Payment Information</CardTitle>
              </div>
              <CardDescription>Enter payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The amount received from the customer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date *</FormLabel>
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
                      The date when the payment was received
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cash, Bank Transfer, Mobile Money, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>How the payment was made</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receipt Number */}
              <FormField
                control={form.control}
                name="receipt_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter receipt reference if available"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Reference number for the receipt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Received By */}
              <FormField
                control={form.control}
                name="received_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the name of the person receiving the payment"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: The name of the person receiving the payment
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
                        placeholder="Any additional information about this payment"
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
                {isSubmitting ? "Processing..." : "Record Payment"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
