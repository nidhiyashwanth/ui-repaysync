"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { interactionService } from "@/lib/api";
import {
  Interaction,
  InteractionType,
  InteractionOutcome,
  UserRole,
} from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

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
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Calendar,
  ChevronLeft,
  UserRound,
  Users,
  FileEdit,
  PlusCircle,
} from "lucide-react";

export default function InteractionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to view interactions
  const canViewInteractions = user !== null;
  const canManageInteractions =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER ||
      user.role === UserRole.CALLING_AGENT);

  useEffect(() => {
    const fetchInteraction = async () => {
      if (!canViewInteractions || !id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await interactionService.getById(id as string);
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
  }, [id, canViewInteractions]);

  // Helper to get interaction type icon
  const getInteractionTypeIcon = (type: InteractionType) => {
    switch (type) {
      case InteractionType.CALL:
        return <Phone className="h-5 w-5" />;
      case InteractionType.EMAIL:
        return <Mail className="h-5 w-5" />;
      case InteractionType.SMS:
        return <MessageSquare className="h-5 w-5" />;
      case InteractionType.MEETING:
        return <Users className="h-5 w-5" />;
      case InteractionType.VISIT:
        return <UserRound className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  // Helper to get outcome badge
  const getOutcomeBadge = (outcome?: InteractionOutcome) => {
    if (!outcome) return null;

    switch (outcome) {
      case InteractionOutcome.PAYMENT_PROMISED:
        return <Badge variant="outline">Payment Promised</Badge>;
      case InteractionOutcome.PAYMENT_MADE:
        return <Badge variant="outline">Payment Made</Badge>;
      case InteractionOutcome.NO_ANSWER:
        return <Badge variant="secondary">No Answer</Badge>;
      case InteractionOutcome.WRONG_NUMBER:
        return <Badge variant="destructive">Wrong Number</Badge>;
      case InteractionOutcome.NUMBER_DISCONNECTED:
        return <Badge variant="destructive">Disconnected</Badge>;
      case InteractionOutcome.CUSTOMER_UNAVAILABLE:
        return <Badge variant="secondary">Unavailable</Badge>;
      case InteractionOutcome.DISPUTED:
        return <Badge variant="default">Disputed</Badge>;
      case InteractionOutcome.REFUSED_TO_PAY:
        return <Badge variant="destructive">Refused Payment</Badge>;
      case InteractionOutcome.OTHER:
        return <Badge variant="outline">Other</Badge>;
      default:
        // Handle cases where outcome might be a string directly from API
        if (typeof outcome === "string") {
          const outcomeStr = outcome as string;
          // Try to map common strings to enum values
          if (outcomeStr.includes("DISCONNECT"))
            return <Badge variant="destructive">Disconnected</Badge>;
          if (outcomeStr.includes("WRONG"))
            return <Badge variant="destructive">Wrong Number</Badge>;
          if (outcomeStr.includes("PROMISED"))
            return <Badge variant="outline">Payment Promised</Badge>;
          if (outcomeStr.includes("MADE"))
            return <Badge variant="outline">Payment Made</Badge>;
          if (outcomeStr.includes("ANSWER"))
            return <Badge variant="secondary">No Answer</Badge>;
          if (outcomeStr.includes("UNAVAILABLE"))
            return <Badge variant="secondary">Unavailable</Badge>;
          if (outcomeStr.includes("DISPUTE"))
            return <Badge variant="default">Disputed</Badge>;
          if (outcomeStr.includes("REFUSED"))
            return <Badge variant="destructive">Refused Payment</Badge>;
        }
        return <Badge variant="outline">{outcome}</Badge>;
    }
  };

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes?: number) => {
    if (!minutes && minutes !== 0) return "—";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (!canViewInteractions) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Interaction Details</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You need to be logged in to view interaction details.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login">Log In</Link>
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
          <h1 className="text-3xl font-bold">Interaction Details</h1>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
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
          <h1 className="text-3xl font-bold">Interaction Details</h1>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href="/interactions">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Interaction Details</h1>
        </div>

        {canManageInteractions && !interaction.outcome && (
          <Button asChild>
            <Link href={`/interactions/${interaction.id}/complete`}>
              <FileEdit className="mr-2 h-4 w-4" />
              Complete Interaction
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center">
              {getInteractionTypeIcon(interaction.interaction_type)}
              <CardTitle className="ml-2">
                {interaction.interaction_type_display} with{" "}
                {interaction.customer_name}
              </CardTitle>
            </div>
            <CardDescription>
              {formatDate(interaction.start_time)} at{" "}
              {formatTime(interaction.start_time)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Customer
                  </h3>
                  <p className="text-base">
                    <Link
                      href={`/customers/${interaction.customer}`}
                      className="text-primary hover:underline"
                    >
                      {interaction.customer_name}
                    </Link>
                  </p>
                </div>

                {interaction.loan && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Related Loan
                    </h3>
                    <p className="text-base">
                      <Link
                        href={`/loans/${interaction.loan}`}
                        className="text-primary hover:underline"
                      >
                        {interaction.loan_reference}
                      </Link>
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Initiated By
                  </h3>
                  <p className="text-base">{interaction.initiated_by_name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Duration
                  </h3>
                  <p className="text-base">
                    {formatDuration(interaction.duration)}
                  </p>
                </div>

                {interaction.contact_person && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Contact Person
                    </h3>
                    <p className="text-base">{interaction.contact_person}</p>
                  </div>
                )}

                {interaction.contact_number && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Contact Number
                    </h3>
                    <p className="text-base">{interaction.contact_number}</p>
                  </div>
                )}

                {interaction.outcome && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Outcome
                    </h3>
                    <div className="mt-1">
                      {getOutcomeBadge(interaction.outcome)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Notes
              </h3>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="whitespace-pre-line">{interaction.notes}</p>
              </div>
            </div>

            {interaction.payment_promise_amount &&
              interaction.payment_promise_date && (
                <div className="border p-4 rounded-md border-primary/30 bg-primary/5">
                  <h3 className="text-sm font-medium mb-2">Payment Promise</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        ${interaction.payment_promise_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {formatDate(interaction.payment_promise_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground border-t pt-4">
            Created on {formatDate(interaction.created_at)} at{" "}
            {formatTime(interaction.created_at)}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/follow-ups/new?interaction=${interaction.id}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Follow-up
              </Link>
            </Button>

            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/customers/${interaction.customer}`}>
                <UserRound className="mr-2 h-4 w-4" />
                View Customer
              </Link>
            </Button>

            {interaction.loan && (
              <Button
                className="w-full justify-start"
                variant="outline"
                asChild
              >
                <Link href={`/loans/${interaction.loan}`}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  View Loan
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
