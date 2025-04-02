"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { interactionService, customerService, loanService } from "@/lib/api";
import { InteractionType, Customer, Loan, UserRole } from "@/lib/types";
import { toast } from "sonner";
import { format, parse } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Define form schema
const formSchema = z.object({
  customer: z.string({ required_error: "Customer is required" }),
  loan: z.string().optional(),
  interaction_type: z.string({
    required_error: "Interaction type is required",
  }),
  contact_number: z.string().optional(),
  contact_person: z.string().optional(),
  start_time: z.date({
    required_error: "Start time is required",
  }),
  notes: z.string({ required_error: "Notes are required" }).min(3, {
    message: "Notes must be at least 3 characters.",
  }),
});

export default function NewInteractionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: new Date(),
      notes: "",
    },
  });

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await customerService.getAll();
        setCustomers(response.results);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch loans when customer is selected
  useEffect(() => {
    const fetchLoansForCustomer = async () => {
      if (!selectedCustomerId) {
        setLoans([]);
        return;
      }

      try {
        setLoadingLoans(true);
        const response = await loanService.getAll({
          customer: selectedCustomerId,
        });
        setLoans(response.results);
      } catch (error) {
        console.error("Error fetching loans:", error);
        toast.error("Failed to load loans for selected customer");
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchLoansForCustomer();
  }, [selectedCustomerId]);

  // Handle customer selection change
  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value);
    form.setValue("customer", value);
    form.setValue("loan", ""); // Reset loan when customer changes
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("You must be logged in to create an interaction");
      return;
    }

    try {
      setLoading(true);

      // Format the date for API submission
      const formattedStartTime = format(
        values.start_time,
        "yyyy-MM-dd'T'HH:mm"
      );

      const interactionData = {
        initiated_by: user.id,
        customer: values.customer,
        interaction_type: values.interaction_type,
        notes: values.notes,
        start_time: formattedStartTime,
        contact_number: values.contact_number,
        contact_person: values.contact_person,
      };

      await interactionService.create(interactionData);
      toast.success("Interaction created successfully");

      // Clear form and navigate to interactions listing
      form.reset();
      router.push("/interactions");
    } catch (error: any) {
      console.error("Failed to create interaction:", error);
      toast.error(error?.message || "Failed to create interaction");
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission
  const canCreateInteractions =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER ||
      user.role === UserRole.CALLING_AGENT);

  if (!canCreateInteractions) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">New Interaction</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You don't have permission to create interactions.
            </p>
            <Button asChild className="mt-4">
              <Link href="/interactions">Back to Interactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Interaction</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Interaction</CardTitle>
          <CardDescription>
            Record a new interaction with a customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer*</FormLabel>
                      <Select
                        disabled={loadingCustomers}
                        onValueChange={handleCustomerChange}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan (Optional)</FormLabel>
                      <Select
                        disabled={!selectedCustomerId || loadingLoans}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a loan (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {loans.map((loan) => (
                            <SelectItem key={loan.id} value={loan.id}>
                              {loan.loan_reference} - {loan.status_display}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional: Link this interaction to a specific loan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interaction Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interaction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={InteractionType.CALL}>
                            Call
                          </SelectItem>
                          <SelectItem value={InteractionType.MEETING}>
                            Meeting
                          </SelectItem>
                          <SelectItem value={InteractionType.EMAIL}>
                            Email
                          </SelectItem>
                          <SelectItem value={InteractionType.SMS}>
                            SMS
                          </SelectItem>
                          <SelectItem value={InteractionType.VISIT}>
                            Visit
                          </SelectItem>
                          <SelectItem value={InteractionType.OTHER}>
                            Other
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time*</FormLabel>
                      <div className="flex flex-col space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP HH:mm")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  // Preserve the time part from the current value
                                  const newDate = new Date(date);
                                  if (field.value) {
                                    newDate.setHours(field.value.getHours());
                                    newDate.setMinutes(
                                      field.value.getMinutes()
                                    );
                                  }
                                  field.onChange(newDate);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Time input */}
                        <div className="flex items-center">
                          <Input
                            type="time"
                            value={
                              field.value ? format(field.value, "HH:mm") : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value
                                .split(":")
                                .map(Number);
                              if (!isNaN(hours) && !isNaN(minutes)) {
                                const newDate = new Date(
                                  field.value || new Date()
                                );
                                newDate.setHours(hours);
                                newDate.setMinutes(minutes);
                                field.onChange(newDate);
                              }
                            }}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Person you spoke with" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number used" {...field} />
                      </FormControl>
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
                    <FormLabel>Notes*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter details about the interaction"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/interactions")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Interaction"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
