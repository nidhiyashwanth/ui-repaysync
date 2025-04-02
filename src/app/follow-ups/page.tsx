"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  FollowUp,
  FollowUpStatus,
  FollowUpPriority,
  FollowUpType,
  UserRole,
} from "@/lib/types";
import { followUpService } from "@/lib/api";
import { formatDate } from "@/lib/utils";
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
  CalendarClock,
  CheckCircle,
  Clock,
  Plus,
  AlertCircle,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function FollowUpsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<string>(
    searchParams.get("priority") || "all"
  );

  // Check if user has permission to view follow-ups
  const canViewFollowUps = user !== null;
  const canManageFollowUps =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER);

  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!canViewFollowUps) return;

      try {
        setLoading(true);

        // Prepare filter parameters
        const params: Record<string, string> = {};

        if (statusFilter && statusFilter !== "all") {
          params.status = statusFilter;
        }

        if (priorityFilter && priorityFilter !== "all") {
          params.priority = priorityFilter;
        }

        // Fetch follow-ups with filters
        const response = await followUpService.getAll(params);
        setFollowUps(response.results);
      } catch (error) {
        console.error("Error fetching follow-ups:", error);
        toast.error("Failed to load follow-ups");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowUps();
  }, [statusFilter, priorityFilter, canViewFollowUps]);

  // Helper to get status badge
  const getStatusBadge = (status: FollowUpStatus) => {
    switch (status) {
      case FollowUpStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>;
      case FollowUpStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case FollowUpStatus.RESCHEDULED:
        return <Badge variant="warning">Rescheduled</Badge>;
      case FollowUpStatus.CANCELED:
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper to get priority badge
  const getPriorityBadge = (priority: FollowUpPriority) => {
    switch (priority) {
      case FollowUpPriority.LOW:
        return <Badge variant="outline">Low</Badge>;
      case FollowUpPriority.MEDIUM:
        return <Badge variant="secondary">Medium</Badge>;
      case FollowUpPriority.HIGH:
        return <Badge variant="default">High</Badge>;
      case FollowUpPriority.URGENT:
        return <Badge variant="destructive">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (!canViewFollowUps) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Follow-ups</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You need to be logged in to view follow-ups.
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
          <h1 className="text-3xl font-bold">Follow-ups</h1>
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
        <h1 className="text-3xl font-bold">Follow-ups</h1>
        {canManageFollowUps && (
          <Button asChild>
            <Link href="/interactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Follow-up
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-full max-w-xs">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={FollowUpStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={FollowUpStatus.COMPLETED}>
                Completed
              </SelectItem>
              <SelectItem value={FollowUpStatus.RESCHEDULED}>
                Rescheduled
              </SelectItem>
              <SelectItem value={FollowUpStatus.CANCELED}>Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full max-w-xs">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value={FollowUpPriority.LOW}>Low</SelectItem>
              <SelectItem value={FollowUpPriority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={FollowUpPriority.HIGH}>High</SelectItem>
              <SelectItem value={FollowUpPriority.URGENT}>Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up List</CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No follow-ups found with the current filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map((followUp) => (
                    <TableRow key={followUp.id}>
                      <TableCell>{followUp.follow_up_type_display}</TableCell>
                      <TableCell>
                        <Link
                          href={`/customers/${followUp.customer}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {followUp.customer_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatDate(followUp.scheduled_date)}
                        {followUp.scheduled_time &&
                          ` ${followUp.scheduled_time}`}
                      </TableCell>
                      <TableCell>{followUp.assigned_to_name}</TableCell>
                      <TableCell>
                        {getPriorityBadge(followUp.priority)}
                      </TableCell>
                      <TableCell>{getStatusBadge(followUp.status)}</TableCell>
                      <TableCell className="text-right">
                        {canManageFollowUps &&
                          followUp.status === FollowUpStatus.PENDING && (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/follow-ups/${followUp.id}/complete`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/follow-ups/${followUp.id}/reschedule`}
                                >
                                  <CalendarClock className="h-4 w-4 mr-1" />
                                  Reschedule
                                </Link>
                              </Button>
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
