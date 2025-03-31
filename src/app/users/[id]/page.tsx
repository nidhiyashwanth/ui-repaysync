"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { UserRole, User } from "@/lib/types";
import { userService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check permissions and fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const fetchedUser = await userService.getById(params.id);
        setUserData(fetchedUser);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
        router.push("/users");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      // Check if user has permission to view details
      if (
        user.role !== UserRole.SUPER_MANAGER &&
        user.role !== UserRole.MANAGER &&
        user.id !== params.id
      ) {
        router.push("/dashboard");
        toast.error("You don't have permission to view this user");
        return;
      }

      fetchUserData();
    }
  }, [user, params.id, router]);

  // Check if current user can edit this user
  const canEdit = () => {
    if (!user || !userData) return false;
    if (user.role === UserRole.SUPER_MANAGER) return true;
    if (user.role === UserRole.MANAGER) {
      return userData.role !== UserRole.SUPER_MANAGER;
    }
    return user.id === userData.id;
  };

  // Check if current user can delete this user
  const canDelete = () => {
    if (!user || !userData) return false;
    if (user.id === userData.id) return false; // Can't delete yourself
    return user.role === UserRole.SUPER_MANAGER;
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await userService.delete(params.id);
      toast.success("User deleted successfully");
      router.push("/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-20 rounded-full mt-2" />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-8 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_MANAGER:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case UserRole.MANAGER:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case UserRole.COLLECTION_OFFICER:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case UserRole.CALLING_AGENT:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>

        <div className="flex gap-2">
          {canEdit() && (
            <Button variant="outline" asChild>
              <Link href={`/users/${params.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Link>
            </Button>
          )}

          {canDelete() && (
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {userData.first_name}{" "}
                    {userData.last_name}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="text-2xl">
                {getInitials(userData.first_name, userData.last_name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">
              {userData.first_name} {userData.last_name}
            </h2>
            <p className="text-muted-foreground mb-1">{userData.username}</p>
            <p className="text-sm text-muted-foreground mb-3">
              {userData.email}
            </p>

            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                userData.role as UserRole
              )}`}
            >
              {userData.role.replace("_", " ")}
            </span>

            <Separator className="my-4" />

            <div className="flex items-center justify-center gap-2">
              {userData.is_active ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Active Account</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Inactive Account</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email Address</span>
                </div>
                <p>{userData.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone Number</span>
                </div>
                <p>{userData.phone || "Not provided"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date Joined</span>
                </div>
                <p>{formatDate(userData.date_joined)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Role</span>
                </div>
                <p>{userData.role.replace("_", " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
