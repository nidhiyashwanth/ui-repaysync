"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Customer, Gender, Loan, UserRole } from "@/lib/types";
import { customerService } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  FileSpreadsheet,
  MessageSquare,
  UserRound,
  Mail,
  Phone,
  Briefcase,
  Home,
  MapPin,
  Plus,
} from "lucide-react";

// Table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CustomerDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Use React.use to resolve the params promise
  const resolvedParams = React.use(params);
  const customerId = resolvedParams.id;

  const { user } = useAuth();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      // Ensure customerId is available before fetching
      if (!customerId) {
        console.log("Customer ID not available yet.");
        setLoading(false); // Stop loading if ID is missing
        return;
      }

      try {
        setLoading(true);
        setCustomer(null); // Reset customer on new ID fetch
        setLoans([]); // Reset loans on new ID fetch

        // Fetch customer details
        const customerData = await customerService.getById(customerId);
        setCustomer(customerData);

        // Fetch customer loans
        const loansData = await customerService.getLoans(customerId);

        // --- Add safety check ---
        if (loansData && Array.isArray(loansData.results)) {
          setLoans(loansData.results);
        } else {
          // Log a warning if the API response structure is unexpected
          console.warn(
            "Loans data received from API is not in the expected format (expected { results: [] }):",
            loansData
          );
          setLoans([]); // Default to an empty array if 'results' is missing or not an array
        }
        // --- End safety check ---
      } catch (error) {
        console.error(
          "Error fetching customer data for ID:",
          customerId,
          error
        );
        toast.error("Failed to load customer details or loans.");
        // Reset state on error as well to be safe
        setCustomer(null);
        setLoans([]);
        // Consider whether navigating away is always the best UX here.
        // Maybe display an error message within the page instead?
        // router.push("/customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId, router]); // Dependency array is correct

  // Check if user has permission to manage customers
  const canManageCustomer =
    user &&
    (user.role === UserRole.SUPER_MANAGER ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COLLECTION_OFFICER);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Customer Not Found</h1>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              The customer you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <Button asChild className="mt-4">
              <Link href="/customers">Back to Customers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            {customer.first_name} {customer.last_name}
          </h1>
          <Badge variant={customer.is_active ? "default" : "secondary"}>
            {customer.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {canManageCustomer && (
          <div className="flex w-full sm:w-auto gap-2">
            <Button asChild variant="outline">
              <Link href={`/customers/${customer.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Customer
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/loans/new?customerId=${customer.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Loan
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Customer Details</TabsTrigger>
          <TabsTrigger value="loans">Loans ({loans.length})</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Full Name
                </h3>
                <p className="text-base">
                  {customer.first_name} {customer.last_name}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Gender
                </h3>
                <p className="text-base">{customer.gender_display}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Date of Birth
                </h3>
                <p className="text-base">
                  {customer.date_of_birth
                    ? formatDate(customer.date_of_birth)
                    : "—"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  National ID
                </h3>
                <p className="text-base">{customer.national_id || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Assigned Officer
                </h3>
                <p className="text-base">
                  {customer.assigned_officer_name || "—"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Customer Since
                </h3>
                <p className="text-base">{formatDate(customer.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle>Contact Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Primary Phone
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-base">{customer.primary_phone}</p>
                  {canManageCustomer && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="h-8 px-2"
                    >
                      <Link
                        href={`/interactions/new?customerId=${customer.id}&phone=${customer.primary_phone}`}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Log Interaction
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {customer.secondary_phone && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Secondary Phone
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-base">{customer.secondary_phone}</p>
                    {canManageCustomer && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-8 px-2"
                      >
                        <Link
                          href={`/interactions/new?customerId=${customer.id}&phone=${customer.secondary_phone}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Log Interaction
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Email
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-base">{customer.email || "—"}</p>
                  {customer.email && canManageCustomer && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="h-8 px-2"
                    >
                      <Link
                        href={`/interactions/new?customerId=${customer.id}&type=EMAIL`}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Log Email
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <CardTitle>Address Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Address
                </h3>
                <p className="text-base">{customer.address || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  City
                </h3>
                <p className="text-base">{customer.city || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  State/Province
                </h3>
                <p className="text-base">{customer.state || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Postal Code
                </h3>
                <p className="text-base">{customer.postal_code || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Country
                </h3>
                <p className="text-base">{customer.country || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Branch
                </h3>
                <p className="text-base">{customer.branch || "—"}</p>
              </div>

              {customer.address && customer.city && canManageCustomer && (
                <div className="sm:col-span-2 mt-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={`/interactions/new?customerId=${customer.id}&type=VISIT`}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Log Field Visit
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle>Employment Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Employer
                </h3>
                <p className="text-base">{customer.employer || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Job Title
                </h3>
                <p className="text-base">{customer.job_title || "—"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Monthly Income
                </h3>
                <p className="text-base">
                  {customer.monthly_income
                    ? formatCurrency(customer.monthly_income)
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Additional Information */}
          {(customer.notes || customer.risk_score) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.risk_score !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Risk Score
                    </h3>
                    <p className="text-base">{customer.risk_score}</p>
                  </div>
                )}

                {customer.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Notes
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Loans</CardTitle>
                <CardDescription>All loans for this customer</CardDescription>
              </div>
              {canManageCustomer && (
                <Button asChild>
                  <Link href={`/loans/new?customerId=${customer.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Loan
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loans.length === 0 ? (
                <div className="text-center py-6">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                  <p className="mt-4 text-muted-foreground">
                    No loans found for this customer
                  </p>
                  {canManageCustomer && (
                    <Button asChild className="mt-4">
                      <Link href={`/loans/new?customerId=${customer.id}`}>
                        Create First Loan
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.map((loan) => (
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
                            <Badge
                              variant={
                                loan.status === "PAID" ||
                                loan.status === "ACTIVE"
                                  ? "default"
                                  : loan.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {loan.status_display}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(loan.principal_amount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(loan.remaining_balance)}
                          </TableCell>
                          <TableCell>
                            {formatDate(loan.application_date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/loans/${loan.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" asChild>
                <Link href={`/customers/${customer.id}/loans`}>
                  View All Loans
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Interactions</CardTitle>
                <CardDescription>Recent customer interactions</CardDescription>
              </div>
              {canManageCustomer && (
                <Button asChild>
                  <Link href={`/interactions/new?customerId=${customer.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Log Interaction
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
              <p className="mt-4 text-muted-foreground">
                The interactions list will be loaded here
              </p>
              <Button asChild className="mt-4">
                <Link href={`/customers/${customer.id}/interactions`}>
                  View All Interactions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
