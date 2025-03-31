"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { UserRole, User } from "@/lib/types";
import { userService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { debounce } from "@/lib/utils";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if not a manager or super manager
  useEffect(() => {
    if (
      user &&
      user.role !== UserRole.SUPER_MANAGER &&
      user.role !== UserRole.MANAGER
    ) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchUsers = async (query = "") => {
    try {
      setLoading(true);
      const params = query ? { search: query } : {};
      const response = await userService.getAll(params);
      setUsers(response.results || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const debouncedSearch = debounce((query: string) => {
    fetchUsers(query);
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Function to get role badge with appropriate color
  const getRoleBadge = (role: UserRole) => {
    const badges = {
      [UserRole.SUPER_MANAGER]: {
        bg: "bg-red-100 dark:bg-red-900",
        icon: <ShieldAlert className="h-3 w-3 mr-1" />,
        text: "text-red-600 dark:text-red-300",
      },
      [UserRole.MANAGER]: {
        bg: "bg-orange-100 dark:bg-orange-900",
        icon: <UserCheck className="h-3 w-3 mr-1" />,
        text: "text-orange-600 dark:text-orange-300",
      },
      [UserRole.COLLECTION_OFFICER]: {
        bg: "bg-blue-100 dark:bg-blue-900",
        icon: <UserCheck className="h-3 w-3 mr-1" />,
        text: "text-blue-600 dark:text-blue-300",
      },
      [UserRole.CALLING_AGENT]: {
        bg: "bg-green-100 dark:bg-green-900",
        icon: <UserCheck className="h-3 w-3 mr-1" />,
        text: "text-green-600 dark:text-green-300",
      },
    };

    const badge = badges[role] || badges[UserRole.CALLING_AGENT];

    return (
      <div
        className={`flex items-center px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}
      >
        {badge.icon}
        {role.replace("_", " ")}
      </div>
    );
  };

  // Check if the current user can edit a particular user
  const canEditUser = (targetUser: User) => {
    if (user?.role === UserRole.SUPER_MANAGER) return true;
    if (user?.role === UserRole.MANAGER) {
      return targetUser.role !== UserRole.SUPER_MANAGER;
    }
    return false;
  };

  // Check if the current user can delete a particular user
  const canDeleteUser = (targetUser: User) => {
    return user?.role === UserRole.SUPER_MANAGER;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4">
            <Skeleton className="h-10 w-full max-w-sm mb-6" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Users</h1>
        {user?.role === UserRole.SUPER_MANAGER && (
          <Button asChild>
            <Link href="/users/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found.{" "}
                    {searchQuery && "Try a different search term."}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                      <div className="text-xs text-muted-foreground">
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role as UserRole)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.date_joined)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          {canEditUser(user) && (
                            <DropdownMenuItem asChild>
                              <Link href={`/users/${user.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {canDeleteUser(user) && (
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => {
                                /* handle delete */
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
      </div>
    </div>
  );
}
