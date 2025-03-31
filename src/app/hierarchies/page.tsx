"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { User, UserRole, Hierarchy } from "@/lib/types";
import api from "@/lib/api"
import { PaginatedResponse } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatDate } from "@/lib/utils";

// Define the form schema for creating a hierarchy
const formSchema = z.object({
  manager: z.string().optional(),
  collection_officer: z.string().min(1, "Collection officer is required"),
});

export default function HierarchiesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State for hierarchies data
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [collectionOfficers, setCollectionOfficers] = useState<User[]>([]);
  const [hierarchyToDelete, setHierarchyToDelete] = useState<Hierarchy | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      manager: user?.role === UserRole.SUPER_MANAGER ? "" : user?.id,
      collection_officer: "",
    },
  });

  // Fetch hierarchies
  useEffect(() => {
    const fetchHierarchies = async () => {
      try {
        setLoading(true);
        const response = await api.get("/hierarchies/");
        setHierarchies(response.data.results);
      } catch (error) {
        console.error("Error fetching hierarchies:", error);
        toast.error("Failed to load hierarchies");
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchies();
  }, []);

  // Fetch managers and collection officers for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const managersResponse = await api.get("/users/", {
          params: {
            role: UserRole.MANAGER,
            is_active: true,
          },
        });
        setManagers(managersResponse.data.results);

        const officersResponse = await api.get("/users/", {
          params: {
            role: UserRole.COLLECTION_OFFICER,
            is_active: true,
          },
        });
        setCollectionOfficers(officersResponse.data.results);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, []);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const finalValues = {
        ...values,
        // If user is not super manager, use their ID as manager
        manager: user?.role === UserRole.SUPER_MANAGER 
          ? values.manager 
          : user?.id,
      };

      const response = await api.post("/hierarchies/", finalValues);
      
      toast.success("Hierarchy created successfully");
      setHierarchies((prev) => [...prev, response.data]);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to create hierarchy";
      toast.error(errorMessage);
      console.error("Error creating hierarchy:", error);
    }
  };

  // Handle hierarchy deletion
  const handleDeleteHierarchy = async () => {
    if (!hierarchyToDelete) return;

    try {
      await api.delete(`/hierarchies/${hierarchyToDelete.id}/`);
      toast.success("Hierarchy deleted successfully");

      // Refresh the list
      setHierarchies((prev) =>
        prev.filter((h) => h.id !== hierarchyToDelete.id)
      );
      setHierarchyToDelete(null);
    } catch (error) {
      console.error("Error deleting hierarchy:", error);
      toast.error("Failed to delete hierarchy");
    }
  };

  // Check if user has permission to manage hierarchies
  const canManageHierarchies =
    user &&
    (user.role === UserRole.SUPER_MANAGER || user.role === UserRole.MANAGER);

  if (!canManageHierarchies) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reporting Structure</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You don't have permission to view or manage reporting structures.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reporting Structure</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Officer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Collection Officer</DialogTitle>
              <DialogDescription>
                Link a collection officer to a manager in the reporting structure.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {user?.role === UserRole.SUPER_MANAGER && (
                  <FormField
                    control={form.control}
                    name="manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.first_name} {manager.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the manager for this reporting relationship
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="collection_officer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Officer *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a collection officer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {collectionOfficers.map((officer) => (
                            <SelectItem key={officer.id} value={officer.id}>
                              {officer.first_name} {officer.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the collection officer to assign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hierarchies Table */}
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
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Collection Officer</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hierarchies.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No reporting structures found
                    </TableCell>
                  </TableRow>
                ) : (
                  hierarchies.map((hierarchy) => (
                    <TableRow key={hierarchy.id}>
                      <TableCell className="font-medium">
                        {hierarchy.manager_name}
                      </TableCell>
                      <TableCell>{hierarchy.collection_officer_name}</TableCell>
                      <TableCell>{formatDate(hierarchy.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => {
                                  e.preventDefault();
                                  setHierarchyToDelete(hierarchy);
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the reporting
                                    relationship between{" "}
                                    <strong>{hierarchy.manager_name}</strong> and{" "}
                                    <strong>
                                      {hierarchy.collection_officer_name}
                                    </strong>
                                    . This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteHierarchy}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}