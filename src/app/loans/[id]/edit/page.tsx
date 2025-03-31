"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Customer,
  Loan,
  LoanStatus,
  PaymentFrequency,
  UserRole,
  User,
} from "@/lib/types";
import { loanService, customerService, userService } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CreditCard } from "lucide-react";
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
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Define form validation schema
const formSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  principal_amount: z
    .string()
    .min(1, "Principal amount is required")
    .transform((val) => parseFloat(val)),
  interest_rate: z
    .string()
    .min(1, "Interest rate is required")
    .transform((val) => parseFloat(val)),
  term_months: z
    .string()
    .min(1, "Loan term is required")
    .transform((val) => parseInt(val, 10)),
  payment_frequency: z.nativeEnum(PaymentFrequency),
  status: z.nativeEnum(LoanStatus),
  application_date: z.date(),
  approval_date: z.date().nullable().optional(),
  disbursement_date: z.date().nullable().optional(),
  first_payment_date: z.date().nullable().optional(),
  maturity_date: z.date().nullable().optional(),
  assigned_officer: z.string().optional(),
  notes: z.string().optional(),
});

export default function EditLoanPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [collectionOfficers, setCollectionOfficers] = useState<User[]>([]);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      principal_amount: "",
      interest_rate: "",
      term_months: "",
      payment_frequency: PaymentFrequency.MONTHLY,
      status: LoanStatus.PENDING,
      application_date: new Date(),
      approval_date: null,
      disbursement_date: null,
      first_payment_date: null,
      maturity_date: null,
      assigned_officer: user?.id,
      notes: "",
    },
  });

  // Fetch loan data and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch the loan to edit
        const loanData = await loanService.getById(params.id);
        setLoan(loanData);

        // Fetch customers for the dropdown
        const customersResponse = await customerService.getAll({
          is_active: true,
        });
        setCustomers(customersResponse.results);

        // Fetch collection officers for assignment
        const officersResponse = await userService.getAll({
          role: UserRole.COLLECTION_OFFICER,
          is_active: true,
        });
        setCollectionOfficers(officersResponse.results);

        // Set form values from loan data
        form.reset({
          customer: loanData.customer,
          principal_amount: String(loanData.principal_amount),
          interest_rate: String(loanData.interest_rate),
          term_months: String(loanData.term_months),
          payment_frequency: loanData.payment_frequency,
          status: loanData.status,
          application_date: parseDate(loanData.application_date),
          approval_date: parseDate(loanData.approval_date),
          disbursement_date: parseDate(loanData.disbursement_date),
          first_payment_date: parseDate(loanData.first_payment_date),
          maturity_date: parseDate(loanData.maturity_date),
          assigned_officer: loanData.assigned_officer || "",
          notes: loanData.notes || "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load loan data");
        router.push("/loans");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, form, router]);

  // Helper to parse date string to Date object
  const parseDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    try {
      return parse(dateString, "yyyy-MM-dd", new Date());
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Format dates to strings
      const payload = {
        ...values,
        application_date: format(values.application_date, "yyyy-MM-dd"),
        approval_date: values.approval_date
          ? format(values.approval_date, "yyyy-MM-dd")
          : undefined,
        disbursement_date: values.disbursement_date
          ? format(values.disbursement_date, "yyyy-MM-dd")
          : undefined,
        first_payment_date: values.first_payment_date
          ? format(values.first_payment_date, "yyyy-MM-dd")
          : undefined,
        maturity_date: values.maturity_date
          ? format(values.maturity_date, "yyyy-MM-dd")
          : undefined,
      };

      await loanService.update(params.id, payload);
      toast.success("Loan updated successfully");
      router.push(`/loans/${params.id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to update loan";
      toast.error(errorMessage);
      console.error("Error updating loan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to edit loans
  const canEditLoan =
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
          <h1 className="text-3xl font-bold">Edit Loan</h1>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
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

  if (!canEditLoan || !loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/loans/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Loan</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!loan
                ? "Loan not found"
                : "You don't have permission to edit loans"}
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
        <h1 className="text-3xl font-bold">Edit Loan</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                <CardTitle>Loan Information</CardTitle>
              </div>
              <CardDescription>Update the loan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Selection */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Customer *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.first_name} {customer.last_name} (
                              {customer.primary_phone})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the customer for this loan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LoanStatus.PENDING}>
                          Pending
                        </SelectItem>
                        <SelectItem value={LoanStatus.ACTIVE}>
                          Active
                        </SelectItem>
                        <SelectItem value={LoanStatus.PAID}>Paid</SelectItem>
                        <SelectItem value={LoanStatus.DEFAULTED}>
                          Defaulted
                        </SelectItem>
                        <SelectItem value={LoanStatus.RESTRUCTURED}>
                          Restructured
                        </SelectItem>
                        <SelectItem value={LoanStatus.WRITTEN_OFF}>
                          Written Off
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current status of the loan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assigned Officer */}
              <FormField
                control={form.control}
                name="assigned_officer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Collection Officer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an officer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collectionOfficers.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            {officer.first_name} {officer.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The officer responsible for managing this loan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Loan Amount and Terms */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="principal_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1000.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interest_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="term_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term (Months) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="payment_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentFrequency.DAILY}>
                          Daily
                        </SelectItem>
                        <SelectItem value={PaymentFrequency.WEEKLY}>
                          Weekly
                        </SelectItem>
                        <SelectItem value={PaymentFrequency.BIWEEKLY}>
                          Bi-weekly
                        </SelectItem>
                        <SelectItem value={PaymentFrequency.MONTHLY}>
                          Monthly
                        </SelectItem>
                        <SelectItem value={PaymentFrequency.QUARTERLY}>
                          Quarterly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often payments are due
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="application_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Date *</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approval_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Approval Date</FormLabel>
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disbursement_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Disbursement Date</FormLabel>
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="first_payment_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>First Payment Date</FormLabel>
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maturity_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Maturity Date</FormLabel>
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes about the loan"
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
