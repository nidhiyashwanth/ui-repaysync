"use client";

import React, { useState, useEffect } from "react"; // <-- Import React
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
  // customer: z.string().min(1, "Customer is required"), // Original - changed to number below
  customer: z.number().min(1, "Customer is required"),
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
  assigned_officer: z.string().optional(), // Keep as string for Select value
  notes: z.string().optional(),
});

// Note: The prop type describes the *resolved* params object
export default function EditLoanPage({ params }: { params: { id: string } }) {
  // --- Use React.use to resolve the params promise ---
  const resolvedParams = React.use(params);
  const loanId = resolvedParams.id; // Get the actual ID
  // --- End change ---

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
      // customer: "" - will be set async, // Original - changed type
      customer: 0, // Use 0 or another invalid number as placeholder before fetch
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
      assigned_officer: "", // Default to empty string
      notes: "",
    },
  });

  // Fetch loan data and customers
  useEffect(() => {
    const fetchData = async () => {
      // Don't run if loanId isn't available yet (React.use might suspend)
      if (!loanId) return;

      try {
        setLoading(true);

        // Fetch the loan to edit - Use resolved loanId
        const loanData = await loanService.getById(loanId);
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
          customer: loanData.customer, // Assuming loanData.customer is the ID (number)
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
          // Ensure assigned_officer is a string for the Select component
          assigned_officer: loanData.assigned_officer
            ? String(loanData.assigned_officer)
            : "",
          notes: loanData.notes || "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load loan data");
        // Use resolved loanId if redirecting back, though just going to /loans might be safer
        router.push("/loans");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Use resolved loanId in the dependency array
  }, [loanId, form, router]); // <-- Use loanId here

  // Helper to parse date string to Date object
  const parseDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    try {
      // Assuming API returns YYYY-MM-DD format
      return parse(dateString, "yyyy-MM-dd", new Date());
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
      // Try parsing directly if format is different (e.g., ISO string)
      try {
        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch (directParseError) {
        console.error("Error parsing date directly:", directParseError);
      }
      return null; // Return null if parsing fails
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Ensure loanId is available before submitting
    if (!loanId) {
      toast.error("Loan ID is missing. Cannot update.");
      return;
    }
    try {
      setIsSubmitting(true);

      // Format dates to strings (YYYY-MM-DD)
      const payload = {
        ...values,
        // Convert assigned_officer back to number if it's not empty, otherwise undefined/null
        assigned_officer: values.assigned_officer
          ? parseInt(values.assigned_officer, 10)
          : null,
        application_date: format(values.application_date, "yyyy-MM-dd"),
        approval_date: values.approval_date
          ? format(values.approval_date, "yyyy-MM-dd")
          : undefined, // Use undefined or null based on API expectation for optional fields
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

      // Use resolved loanId for the update
      await loanService.update(loanId, payload);
      toast.success("Loan updated successfully");
      // Use resolved loanId for navigation
      router.push(`/loans/${loanId}`);
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

  // Use resolved loanId for links and checks
  const backLinkHref = loanId ? `/loans/${loanId}` : "/loans";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            {/* Use placeholder link if loanId not ready */}
            <Link href={backLinkHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Loan</h1>
        </div>

        {/* Skeleton Loader remains the same */}
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 8 }).map(
              (
                _,
                i // Increased count slightly for more fields
              ) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />{" "}
                  {/* Adjusted height for inputs/selects */}
                </div>
              )
            )}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-20 mr-2" />
            <Skeleton className="h-10 w-24" /> {/* Adjusted width */}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Use resolved loanId for links and checks
  if (!canEditLoan || !loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backLinkHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Loan</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!loan
                ? "Loan not found or could not be loaded." // Adjusted message
                : "You don't have permission to edit loans."}
            </p>
            <Button asChild className="mt-4">
              <Link href={backLinkHref}>Return to Loan Details</Link>
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
          {/* Use resolved loanId */}
          <Link href={backLinkHref}>
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
                      {/* Ensure value passed to Select is string */}
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        } // Convert back to number for form state
                        value={String(field.value || "")} // Ensure value is string, handle 0 or undefined
                        disabled={!customers.length} // Disable if customers haven't loaded
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Add placeholder/loading state if needed */}
                          {!customers.length && (
                            <SelectItem value="" disabled>
                              Loading customers...
                            </SelectItem>
                          )}
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={String(customer.id)}
                            >
                              {" "}
                              {/* Value must be string */}
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
                        {Object.values(LoanStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {/* Simple Capitalization for display */}
                            {status.charAt(0).toUpperCase() +
                              status.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
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
                      value={field.value || ""} // Ensure value is a string
                      disabled={!collectionOfficers.length} // Disable if officers haven't loaded
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an officer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Add an option for unassigned */}
                        <SelectItem value="none">Unassigned</SelectItem>
                        {!collectionOfficers.length && (
                          <SelectItem value="none" disabled>
                            Loading officers...
                          </SelectItem>
                        )}
                        {collectionOfficers.map((officer) => (
                          // Value must be string for SelectItem
                          <SelectItem
                            key={officer.id}
                            value={String(officer.id)}
                          >
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
                          // Ensure value is string for input, handle potential non-string state
                          value={String(field.value || "")}
                          onChange={(e) => field.onChange(e.target.value)} // Let Zod handle transform
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
                          value={String(field.value || "")}
                          onChange={(e) => field.onChange(e.target.value)}
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
                        <Input
                          type="number"
                          placeholder="12"
                          {...field}
                          value={String(field.value || "")}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
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
                        {Object.values(PaymentFrequency).map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {/* Simple Capitalization for display */}
                            {freq.charAt(0).toUpperCase() +
                              freq.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
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
              {/* Date fields remain largely the same, just ensure field.value is handled correctly */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {/* Application Date */}
                <FormField
                  control={form.control}
                  name="application_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      {" "}
                      {/* Added pt-2 for better alignment */}
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
                                format(field.value, "PPP") // PPP format e.g., Jan 1, 2023
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
                            // disabled={(date) => date > new Date() || date < new Date("1900-01-01")} // Optional: date constraints
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Approval Date */}
                <FormField
                  control={form.control}
                  name="approval_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
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
                            selected={field.value || undefined} // Handle null value
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Disbursement Date */}
                <FormField
                  control={form.control}
                  name="disbursement_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
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

                {/* First Payment Date */}
                <FormField
                  control={form.control}
                  name="first_payment_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
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

                {/* Maturity Date */}
                <FormField
                  control={form.control}
                  name="maturity_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
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

              {/* Notes */}
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
                        value={field.value || ""} // Ensure value is string
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {" "}
              {/* Use justify-end and gap */}
              <Button
                type="button" // Set type to button to prevent form submission
                variant="outline"
                // Use resolved loanId
                onClick={() => router.push(backLinkHref)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isDirty}
              >
                {" "}
                {/* Disable if not submitting or form unchanged */}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
