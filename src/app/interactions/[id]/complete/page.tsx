"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { interactionService } from "@/lib/api";
import { Interaction, InteractionOutcome, UserRole } from "@/lib/types";
import { formatDate, formatTime, cn } from "@/lib/utils";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, CalendarIcon } from "lucide-react";
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

// Define form schema
const formSchema = z
  .object({
    outcome: z.string({ required_error: "Outcome is required" }),
    payment_promise_amount: z.string().optional(),
    payment_promise_date: z.string().optional(),
    notes: z.string().optional(),
    end_time: z.string().default(() => {
      const now = new Date();
      return format(now, "yyyy-MM-dd'T'HH:mm");
    }),
  })
  .superRefine((data, ctx) => {
    if (data.outcome === InteractionOutcome.PAYMENT_PROMISED) {
      if (!data.payment_promise_amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Payment amount is required when outcome is 'Payment Promised'",
          path: ["payment_promise_amount"],
        });
      }
      if (!data.payment_promise_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Payment date is required when outcome is 'Payment Promised'",
          path: ["payment_promise_date"],
        });
      }
    }
  });

export default function CompleteInteractionPage() {
  const params = useParams();
  const interactionId = params.id as string;

  const router = useRouter();
  const { user } = useAuth();
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: "",
    },
  });

  // Watch the outcome to show/hide payment promise fields
  const outcomeValue = form.watch("outcome");
  const showPaymentPromiseFields =
    outcomeValue === InteractionOutcome.PAYMENT_PROMISED;

  // Check if user has permission to manage interactions
  const canManageInteractions =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER ||
      user.role === UserRole.CALLING_AGENT);

  useEffect(() => {
    const fetchInteraction = async () => {
      if (!canManageInteractions || !interactionId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await interactionService.getById(interactionId);

        // Check if the interaction is already completed
        if (data.outcome) {
          toast.error("This interaction is already completed");
          router.push(`/interactions/${interactionId}`);
          return;
        }

        setInteraction(data);
      } catch (error: any) {
        console.error("Error fetching interaction:", error);
        setError("Failed to load interaction details");
        toast.error("Failed to load interaction details");
      } finally {
        setLoading(false);
      }
    };

    fetchInteraction();
  }, [interactionId, canManageInteractions, router]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!interaction || !user) return;

    try {
      setSubmitting(true);

      // Parse payment amount if provided
      let paymentAmount = undefined;
      if (values.payment_promise_amount) {
        paymentAmount = parseFloat(values.payment_promise_amount);
        if (isNaN(paymentAmount)) {
          toast.error("Invalid payment amount");
          return;
        }
      }

      // Prepare update data
      const updateData = {
        outcome: values.outcome,
        end_time: values.end_time,
        notes:
          interaction.notes +
          (values.notes ? `\n\nCompletion Notes: ${values.notes}` : ""),
        payment_promise_amount: paymentAmount,
        payment_promise_date: values.payment_promise_date,
      };

      // Update the interaction
      await interactionService.update(interactionId, updateData);

      toast.success("Interaction completed successfully");
      router.push(`/interactions/${interactionId}`);
    } catch (error: any) {
      console.error("Error completing interaction:", error);
      toast.error(
        error.response?.data?.detail || "Failed to complete interaction"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageInteractions) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Complete Interaction</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You don't have permission to complete interactions.
            </p>
            <Button asChild className="mt-4">
              <Link href="/interactions">Back to Interactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href="/interactions">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Complete Interaction</h1>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !interaction) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href="/interactions">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Complete Interaction</h1>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {error || "Failed to load interaction details. Please try again."}
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/interactions")}
            >
              Back to Interactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="outline" size="sm" className="mr-4" asChild>
          <Link href={`/interactions/${interaction.id}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Complete Interaction</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Complete Interaction with {interaction.customer_name}
          </CardTitle>
          <CardDescription>
            Record the outcome and details of this interaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outcome*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the outcome" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            value={InteractionOutcome.PAYMENT_PROMISED}
                          >
                            Payment Promised
                          </SelectItem>
                          <SelectItem value={InteractionOutcome.PAYMENT_MADE}>
                            Payment Made
                          </SelectItem>
                          <SelectItem value={InteractionOutcome.NO_ANSWER}>
                            No Answer
                          </SelectItem>
                          <SelectItem value={InteractionOutcome.WRONG_NUMBER}>
                            Wrong Number
                          </SelectItem>
                          <SelectItem
                            value={InteractionOutcome.NUMBER_DISCONNECTED}
                          >
                            Disconnected
                          </SelectItem>
                          <SelectItem
                            value={InteractionOutcome.CUSTOMER_UNAVAILABLE}
                          >
                            Unavailable
                          </SelectItem>
                          <SelectItem value={InteractionOutcome.DISPUTED}>
                            Disputed
                          </SelectItem>
                          <SelectItem value={InteractionOutcome.REFUSED_TO_PAY}>
                            Refused Payment
                          </SelectItem>
                          <SelectItem value={InteractionOutcome.OTHER}>
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
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time*</FormLabel>
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
                                  format(
                                    parse(
                                      field.value,
                                      "yyyy-MM-dd'T'HH:mm",
                                      new Date()
                                    ),
                                    "PPP HH:mm"
                                  )
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value
                                  ? parse(
                                      field.value,
                                      "yyyy-MM-dd'T'HH:mm",
                                      new Date()
                                    )
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  // Preserve the time part from the current value
                                  const currentDateTime = field.value
                                    ? parse(
                                        field.value,
                                        "yyyy-MM-dd'T'HH:mm",
                                        new Date()
                                      )
                                    : new Date();
                                  const newDate = new Date(date);
                                  newDate.setHours(currentDateTime.getHours());
                                  newDate.setMinutes(
                                    currentDateTime.getMinutes()
                                  );
                                  field.onChange(
                                    format(newDate, "yyyy-MM-dd'T'HH:mm")
                                  );
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
                              field.value
                                ? format(
                                    parse(
                                      field.value,
                                      "yyyy-MM-dd'T'HH:mm",
                                      new Date()
                                    ),
                                    "HH:mm"
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value
                                .split(":")
                                .map(Number);
                              if (!isNaN(hours) && !isNaN(minutes)) {
                                const newDate = field.value
                                  ? parse(
                                      field.value,
                                      "yyyy-MM-dd'T'HH:mm",
                                      new Date()
                                    )
                                  : new Date();
                                newDate.setHours(hours);
                                newDate.setMinutes(minutes);
                                field.onChange(
                                  format(newDate, "yyyy-MM-dd'T'HH:mm")
                                );
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

                {showPaymentPromiseFields && (
                  <>
                    <FormField
                      control={form.control}
                      name="payment_promise_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Promise Amount*</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter amount"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The amount the customer has promised to pay
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payment_promise_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Promise Date*</FormLabel>
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
                                      format(
                                        parse(
                                          field.value,
                                          "yyyy-MM-dd",
                                          new Date()
                                        ),
                                        "PPP"
                                      )
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? parse(
                                          field.value,
                                          "yyyy-MM-dd",
                                          new Date()
                                        )
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      field.onChange(
                                        format(date, "yyyy-MM-dd")
                                      );
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormDescription>
                            The date the customer has promised to make the
                            payment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes about the outcome"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes will be appended to the original interaction
                      notes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/interactions/${interaction.id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Completing..." : "Complete Interaction"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
