"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Interaction,
  InteractionType,
  InteractionOutcome,
  UserRole,
} from "@/lib/types";
import { interactionService } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Calendar,
  Plus,
  Search,
  ArrowUpDown,
  Users,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function InteractionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get("type") || "all"
  );
  const [outcomeFilter, setOutcomeFilter] = useState<string>(
    searchParams.get("outcome") || "all"
  );

  // Check if user has permission to view interactions
  const canViewInteractions = user !== null;
  const canManageInteractions =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER ||
      user.role === UserRole.CALLING_AGENT);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!canViewInteractions) return;

      try {
        setLoading(true);
        setError(null);

        // Prepare filter parameters
        const params: Record<string, string> = {};

        if (typeFilter && typeFilter !== "all") {
          params.interaction_type = typeFilter;
        }

        if (outcomeFilter && outcomeFilter !== "all") {
          params.outcome = outcomeFilter;
        }

        // Fetch interactions with filters
        const response = await interactionService.getAll(params);
        setInteractions(response.results);
      } catch (error: any) {
        console.error("Error fetching interactions:", error);
        setError("Failed to load interactions. Please try again.");

        // If there's a network error, try again after a delay
        if (error.message?.includes("Network Error")) {
          setTimeout(() => {
            fetchInteractions();
          }, 3000);
        }

        toast.error(
          "Failed to load interactions. Please check your connection."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [typeFilter, outcomeFilter, canViewInteractions]);

  // Helper to get interaction type icon
  const getInteractionTypeIcon = (type: InteractionType) => {
    switch (type) {
      case InteractionType.CALL:
        return <Phone className="h-4 w-4" />;
      case InteractionType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case InteractionType.SMS:
        return <MessageSquare className="h-4 w-4" />;
      case InteractionType.MEETING:
        return <Users className="h-4 w-4" />;
      case InteractionType.VISIT:
        return <UserRound className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
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
        <h1 className="text-3xl font-bold">Interactions</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You need to be logged in to view interactions.
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Interactions</h1>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Interactions</h1>
        {canManageInteractions && (
          <Button asChild>
            <Link href="/interactions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Interaction
            </Link>
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center text-destructive">
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-full max-w-xs">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={InteractionType.CALL}>Call</SelectItem>
              <SelectItem value={InteractionType.MEETING}>Meeting</SelectItem>
              <SelectItem value={InteractionType.EMAIL}>Email</SelectItem>
              <SelectItem value={InteractionType.SMS}>SMS</SelectItem>
              <SelectItem value={InteractionType.VISIT}>Visit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full max-w-xs">
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value={InteractionOutcome.PAYMENT_PROMISED}>
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
              <SelectItem value={InteractionOutcome.NUMBER_DISCONNECTED}>
                Disconnected
              </SelectItem>
              <SelectItem value={InteractionOutcome.CUSTOMER_UNAVAILABLE}>
                Unavailable
              </SelectItem>
              <SelectItem value={InteractionOutcome.DISPUTED}>
                Disputed
              </SelectItem>
              <SelectItem value={InteractionOutcome.REFUSED_TO_PAY}>
                Refused Payment
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No interactions found with the current filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Initiated By</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interactions.map((interaction) => (
                    <TableRow key={interaction.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getInteractionTypeIcon(interaction.interaction_type)}
                          <span className="ml-2">
                            {interaction.interaction_type_display}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/customers/${interaction.customer}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {interaction.customer_name}
                        </Link>
                        {interaction.loan && (
                          <div className="text-sm text-muted-foreground">
                            <Link
                              href={`/loans/${interaction.loan}`}
                              className="hover:underline"
                            >
                              Loan: {interaction.loan_reference}
                            </Link>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(interaction.start_time)}
                        <div className="text-sm text-muted-foreground">
                          {formatTime(interaction.start_time)}
                        </div>
                      </TableCell>
                      <TableCell>{interaction.initiated_by_name}</TableCell>
                      <TableCell>
                        {formatDuration(interaction.duration)}
                      </TableCell>
                      <TableCell>
                        {getOutcomeBadge(interaction.outcome)}
                        {interaction.payment_promise_amount &&
                          interaction.payment_promise_date && (
                            <div className="mt-1 text-xs">
                              Promise:{" "}
                              {formatDate(interaction.payment_promise_date)}
                            </div>
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageInteractions && (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/interactions/${interaction.id}`}>
                                <Search className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            {!interaction.outcome && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/interactions/${interaction.id}/complete`}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Complete
                                </Link>
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
