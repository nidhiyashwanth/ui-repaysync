"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { FollowUp, FollowUpStatus, UserRole } from "@/lib/types";
import { followUpService } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Calendar, CalendarClock } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parse } from "date-fns";
import { cn, formatDate } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

// Define form validation schema
const formSchema = z.object({
  scheduled_date: z.date({
    required_error: "Reschedule date is required",
  }),
  scheduled_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  notes: z.string().optional(),
});

export default function RescheduleFollowUpPage({
  params,
}: {
  params: { id: string };
}) {
  // Use React.use to resolve the params promise
  const resolvedParams = React.use(params);
  const followUpId = resolvedParams.id;

  const { user } = useAuth();
  const router = useRouter();
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduled_date: new Date(),
      scheduled_time: "",
      notes: "",
    },
  });

  // Check if user has permission to reschedule follow-ups
  const canRescheduleFollowUp =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER) &&
    followUp?.status === FollowUpStatus.PENDING;

  // Fetch follow-up data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await followUpService.getById(followUpId);
        setFollowUp(data);

        // Set default values with existing follow-up data
        if (data) {
          form.setValue("scheduled_date", new Date(data.scheduled_date));
          if (data.scheduled_time) {
            form.setValue("scheduled_time", data.scheduled_time);
          }
        }
      } catch (error) {
        console.error("Error fetching follow-up:", error);
        toast.error("Failed to load follow-up details");
        router.push("/follow-ups");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [followUpId, router, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!canRescheduleFollowUp) {
      toast.error("You don't have permission to reschedule this follow-up");
      return;
    }

    try {
      setIsSubmitting(true);

      // Format date for API
      const formattedValues = {
        ...values,
        scheduled_date: format(values.scheduled_date, "yyyy-MM-dd"),
      };

      await followUpService.reschedule(followUpId, formattedValues);
      toast.success("Follow-up rescheduled successfully");
      router.push("/follow-ups");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to reschedule follow-up";
      toast.error(errorMessage);
      console.error("Error rescheduling follow-up:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/follow-ups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Reschedule Follow-up</h1>
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

  if (!canRescheduleFollowUp || !followUp) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/follow-ups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Reschedule Follow-up</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!followUp
                ? "Follow-up not found"
                : followUp.status !== FollowUpStatus.PENDING
                ? "Only pending follow-ups can be rescheduled"
                : "You don't have permission to reschedule this follow-up"}
            </p>
            <Button asChild className="mt-4">
              <Link href="/follow-ups">Return to Follow-ups</Link>
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
          <Link href="/follow-ups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Reschedule Follow-up</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up Details</CardTitle>
          <CardDescription>
            Originally scheduled for {formatDate(followUp.scheduled_date)}
            {followUp.scheduled_time && ` at ${followUp.scheduled_time}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Customer
              </h3>
              <p>{followUp.customer_name}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Type
              </h3>
              <p>{followUp.follow_up_type_display}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Priority
              </h3>
              <p>{followUp.priority_display}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Assigned To
              </h3>
              <p>{followUp.assigned_to_name}</p>
            </div>
          </div>

          {followUp.notes && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Notes
              </h3>
              <p className="whitespace-pre-wrap">{followUp.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reschedule Details</CardTitle>
          <CardDescription>
            Select a new date and time for this follow-up
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>New Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select a new date for the follow-up
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Time (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="HH:MM (e.g., 14:30)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter time in 24-hour format (e.g., 14:30)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rescheduling Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this follow-up is being rescheduled"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add a note explaining why the follow-up is being
                      rescheduled
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/follow-ups")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Reschedule Follow-up
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
