"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Loan, LoanStatus, UserRole } from "@/lib/types";
import { loanService } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CreditCard,
  MessageSquare,
  CalendarClock,
} from "lucide-react";

export default function LoansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for loans data
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // State for filters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  // Fetch loans with current filters
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);

        const params: Record<string, any> = {};

        if (searchQuery) {
          params.search = searchQuery;
        }

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        const response = await loanService.getAll(params);
        setLoans(response.results);
      } catch (error) {
        console.error("Error fetching loans:", error);
        toast.error("Failed to load loans");
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [searchQuery, statusFilter]);

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const newUrl = `/loans${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle loan deletion
  const handleDeleteLoan = async () => {
    if (!loanToDelete) return;

    try {
      await loanService.remove(loanToDelete.id);
      toast.success("Loan deleted successfully");

      // Refresh the list
      setLoans((prev) => prev.filter((l) => l.id !== loanToDelete.id));
      setLoanToDelete(null);
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error("Failed to delete loan");
    }
  };

  // Check if user has permission to add/edit/delete
  const canManageLoans =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER);

  // Helper to get a status badge
  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.PENDING:
        return <Badge variant="secondary">Pending</Badge>;
      case LoanStatus.ACTIVE:
        return <Badge>Active</Badge>;
      case LoanStatus.PAID:
        return <Badge variant="success">Paid</Badge>;
      case LoanStatus.DEFAULTED:
        return <Badge variant="destructive">Defaulted</Badge>;
      case LoanStatus.RESTRUCTURED:
        return <Badge variant="warning">Restructured</Badge>;
      case LoanStatus.WRITTEN_OFF:
        return <Badge variant="outline">Written Off</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Loans</h1>
        {canManageLoans && (
          <Button asChild>
            <Link href="/loans/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Loan
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={LoanStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={LoanStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={LoanStatus.PAID}>Paid</SelectItem>
              <SelectItem value={LoanStatus.DEFAULTED}>Defaulted</SelectItem>
              <SelectItem value={LoanStatus.RESTRUCTURED}>
                Restructured
              </SelectItem>
              <SelectItem value={LoanStatus.WRITTEN_OFF}>
                Written Off
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="w-full sm:w-auto">
          Search
        </Button>
      </div>

      {/* Loans Table */}
      {loading ? (
        <div className="space-y-4">
          {/* Skeleton loader for table */}
          <div className="border rounded-lg">
            <div className="border-b h-12 bg-muted/50" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex p-4 border-b">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Application Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No loans found
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/loans/${loan.id}`}
                        className="hover:underline"
                      >
                        {loan.loan_reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/customers/${loan.customer}`}
                        className="hover:underline"
                      >
                        {loan.customer_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(loan.principal_amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(loan.remaining_balance)}
                    </TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>{formatDate(loan.application_date)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/loans/${loan.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/loans/${loan.id}/payments`}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              View Payments
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canManageLoans && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/loans/${loan.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setLoanToDelete(loan)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!loanToDelete}
        onOpenChange={(open) => !open && setLoanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan?
              {loanToDelete && (
                <p className="font-medium mt-2">
                  Reference: {loanToDelete.loan_reference}
                  <br />
                  Customer: {loanToDelete.customer_name}
                </p>
              )}
              This action cannot be undone and will also delete all related
              payments, interactions and follow-ups.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLoan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
