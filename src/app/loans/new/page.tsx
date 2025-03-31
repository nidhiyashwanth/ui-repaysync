"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Customer,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

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
  application_date: z.date(),
  approval_date: z.date().nullable().optional(),
  disbursement_date: z.date().nullable().optional(),
  first_payment_date: z.date().nullable().optional(),
  maturity_date: z.date().nullable().optional(),
  assigned_officer: z.string().optional(),
  notes: z.string().optional(),
});

export default function NewLoanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [collectionOfficers, setCollectionOfficers] = useState<User[]>([]);
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
      application_date: new Date(),
      approval_date: null,
      disbursement_date: null,
      first_payment_date: null,
      maturity_date: null,
      assigned_officer: user?.id,
      notes: "",
    },
  });

  // Fetch customers for the dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await customerService.getAll({
          is_active: true,
        });
        setCustomers(response.results);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch collection officers for assignment
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const response = await userService.getAll({
          role: UserRole.COLLECTION_OFFICER,
          is_active: true,
        });
        setCollectionOfficers(response.results);
      } catch (error) {
        console.error("Error fetching collection officers:", error);
      }
    };

    fetchOfficers();
  }, []);

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
        // Set initial loan status to PENDING
        status: LoanStatus.PENDING,
      };

      const response = await loanService.create(payload);
      toast.success("Loan created successfully");
      router.push(`/loans/${response.id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to create loan";
      toast.error(errorMessage);
      console.error("Error creating loan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to create loans
  const canCreateLoan =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER);

  if (!canCreateLoan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create Loan</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You don't have permission to create loans
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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Loan</h1>
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
              <CardDescription>
                Enter the details of the new loan application
              </CardDescription>
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
                        defaultValue={field.value}
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

              {/* Payment Frequency */}
              <FormField
                control={form.control}
                name="payment_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment frequency" />
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
                      How often payments will be made
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormDescription>
                        Leave blank for pending loans
                      </FormDescription>
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
                      <FormDescription>
                        When funds were disbursed
                      </FormDescription>
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
                      <FormDescription>Final repayment date</FormDescription>
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
                onClick={() => router.push("/loans")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Loan"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
