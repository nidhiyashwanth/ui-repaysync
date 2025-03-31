"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { UserRole, User } from "@/lib/types";
import { userService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCog, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

// Define form validation schema
const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  // Password is optional for edits
  password: z.union([
    z.string().min(8, "Password must be at least 8 characters"),
    z.string().length(0),
  ]),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum([
    UserRole.SUPER_MANAGER,
    UserRole.MANAGER,
    UserRole.COLLECTION_OFFICER,
    UserRole.CALLING_AGENT,
  ]),
  is_active: z.boolean().default(true),
});

export default function EditUserPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: UserRole.COLLECTION_OFFICER,
      is_active: true,
    },
  });

  // Check permissions and fetch user data
  useEffect(() => {
    const checkPermissionAndFetchUser = async () => {
      try {
        // Check if current user has permission
        if (user) {
          if (
            user.role !== UserRole.SUPER_MANAGER &&
            user.role !== UserRole.MANAGER
          ) {
            router.push("/users");
            toast.error("You don't have permission to edit users");
            return;
          }

          // Fetch the user to edit
          setLoading(true);
          const fetchedUser = await userService.getById(params.id);
          setUserToEdit(fetchedUser);

          // Check if manager is trying to edit a super manager
          if (
            user.role === UserRole.MANAGER &&
            fetchedUser.role === UserRole.SUPER_MANAGER
          ) {
            router.push("/users");
            toast.error("You don't have permission to edit Super Managers");
            return;
          }

          // Set form values
          form.reset({
            username: fetchedUser.username,
            password: "", // Don't populate password
            first_name: fetchedUser.first_name,
            last_name: fetchedUser.last_name,
            email: fetchedUser.email,
            phone: fetchedUser.phone || "",
            role: fetchedUser.role as UserRole,
            is_active: fetchedUser.is_active,
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
        router.push("/users");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkPermissionAndFetchUser();
    }
  }, [user, params.id, router, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Create a new object without password if it's empty
      const { password, ...otherFields } = values;
      const payload = password ? { ...otherFields, password } : otherFields;

      await userService.update(params.id, payload);
      toast.success("User updated successfully");
      router.push("/users");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to update user";
      toast.error(errorMessage);
      console.error("Error updating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit User</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full max-w-[250px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skeleton for form */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
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

  // If no user to edit was found or permission issues
  if (!userToEdit) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit User</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            <CardTitle>User Information</CardTitle>
          </div>
          <CardDescription>
            Update user account information for {userToEdit.first_name}{" "}
            {userToEdit.last_name}.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Login Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Login Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Leave blank to keep current"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to keep current password
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Role and Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Role and Status</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={user?.id === userToEdit.id} // Prevent changing own role
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Only Super Managers can assign Super Manager role */}
                            {user?.role === UserRole.SUPER_MANAGER && (
                              <SelectItem value={UserRole.SUPER_MANAGER}>
                                Super Manager
                              </SelectItem>
                            )}
                            <SelectItem value={UserRole.MANAGER}>
                              Manager
                            </SelectItem>
                            <SelectItem value={UserRole.COLLECTION_OFFICER}>
                              Collection Officer
                            </SelectItem>
                            <SelectItem value={UserRole.CALLING_AGENT}>
                              Calling Agent
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {user?.id === userToEdit.id && (
                          <FormDescription>
                            You cannot change your own role
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={user?.id === userToEdit.id} // Can't deactivate yourself
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Account</FormLabel>
                          <FormDescription>
                            {user?.id === userToEdit.id
                              ? "You cannot deactivate your own account"
                              : "Inactive accounts cannot log in"}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push("/users")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
