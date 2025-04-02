"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { FollowUp, FollowUpStatus, UserRole } from "@/lib/types";
import { followUpService } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React from "react";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Define form validation schema
const formSchema = z.object({
  result: z.string().min(1, "Result is required"),
  notes: z.string().optional(),
});

export default function CompleteFollowUpPage({
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
      result: "",
      notes: "",
    },
  });

  // Check if user has permission to complete follow-ups
  const canCompleteFollowUp =
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
      } catch (error) {
        console.error("Error fetching follow-up:", error);
        toast.error("Failed to load follow-up details");
        router.push("/follow-ups");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [followUpId, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!canCompleteFollowUp) {
      toast.error("You don't have permission to complete this follow-up");
      return;
    }

    try {
      setIsSubmitting(true);
      await followUpService.complete(followUpId, values);
      toast.success("Follow-up completed successfully");
      router.push("/follow-ups");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to complete follow-up";
      toast.error(errorMessage);
      console.error("Error completing follow-up:", error);
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
          <h1 className="text-3xl font-bold">Complete Follow-up</h1>
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

  if (!canCompleteFollowUp || !followUp) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/follow-ups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Complete Follow-up</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {!followUp
                ? "Follow-up not found"
                : followUp.status !== FollowUpStatus.PENDING
                ? "Only pending follow-ups can be completed"
                : "You don't have permission to complete this follow-up"}
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
        <h1 className="text-3xl font-bold">Complete Follow-up</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up Details</CardTitle>
          <CardDescription>
            Complete the follow-up for {followUp.customer_name}
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
                Scheduled Date
              </h3>
              <p>
                {formatDate(followUp.scheduled_date)}
                {followUp.scheduled_time && ` ${followUp.scheduled_time}`}
              </p>
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
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Created By
              </h3>
              <p>{followUp.created_by_name}</p>
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
          <CardTitle>Complete Follow-up</CardTitle>
          <CardDescription>Record the result of this follow-up</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the outcome or result of this follow-up"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe what happened during this follow-up
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
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes or details"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any additional information you'd like to record
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
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Follow-up
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
