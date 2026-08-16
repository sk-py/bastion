import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Settings,
  Plus,
  Download,
  Users,
  UserCheck,
  ShieldCheck,
  SlidersHorizontal,
  Calendar,
  MoreVertical,
  Loader2,
} from "lucide-react";

import {
  addUserSchema,
  type AddUserSchema,
} from "@bastion/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useWorkspaceUsers } from "@/features/groups/hooks/use-groups";
import { useAddUser } from "./hooks/use-users";

type Role = "owner" | "admin" | "member";

type StatusFilter = "all" | "active" | "inactive";
type RoleFilter = "all" | Role;

const APP_VERSION = "v2.4.0";

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const {
    data: users = [],
    isPending,
    isError,
  } = useWorkspaceUsers();

  const {
    mutateAsync: addUser,
    isPending: isAddingUser,
  } = useAddUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<AddUserSchema>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "member",
      mustChangePassword: true,
    },
  });

  const selectedRole = watch("role");
  const mustChangePassword = watch("mustChangePassword");

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    searchQuery,
    roleFilter,
    statusFilter,
  ]);

  const totalMembers = users.filter(
    (user) => user.role === "member",
  ).length;

  const totalAdmins = users.filter(
    (user) =>
      user.role === "admin" ||
      user.role === "owner",
  ).length;

  const activeUsers = users.filter(
    (user) => user.isActive,
  ).length;

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "member":
        return "Member";
    }
  };

  const getStatusStyles = (isActive: boolean) => {
    return isActive
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
  };

  const handleAddUser = async (
    values: AddUserSchema,
  ) => {
    await addUser(values);

    reset({
      name: "",
      email: "",
      password: "",
      role: "member",
      mustChangePassword: true,
    });

    setIsAddUserOpen(false);
  };

  const handleCloseAddUser = () => {
    reset({
      name: "",
      email: "",
      password: "",
      role: "member",
      mustChangePassword: true,
    });

    setIsAddUserOpen(false);
  };

  return (
    <div className="p-8 w-full bg-background min-h-screen text-foreground space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Team Members
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to your workspace.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-background"
            >
              <Settings className="w-4 h-4 mr-2" />
              Team Settings
            </Button>

            <Button
              onClick={() =>
                setIsAddUserOpen(true)
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="bg-background text-xs h-8"
            disabled
          >
            <Download className="w-3 h-3 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Users className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Members
            </p>

            <p className="text-2xl font-bold mt-1">
              {totalMembers}
            </p>
          </div>
        </div>

        <div className="p-6 bg-card border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Active Users
            </p>

            <p className="text-2xl font-bold mt-1">
              {activeUsers}
            </p>
          </div>
        </div>

        <div className="p-6 bg-card border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Administrators
            </p>

            <p className="text-2xl font-bold mt-1">
              {totalAdmins}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-1 items-center gap-3 w-full flex-wrap">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search members..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(value) =>
              setRoleFilter(value as RoleFilter)
            }
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Roles
              </SelectItem>

              <SelectItem value="owner">
                Owner
              </SelectItem>

              <SelectItem value="admin">
                Admin
              </SelectItem>

              <SelectItem value="member">
                Member
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(
                value as StatusFilter,
              )
            }
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Status
              </SelectItem>

              <SelectItem value="active">
                Active
              </SelectItem>

              <SelectItem value="inactive">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="bg-background"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-card overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading members...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-sm text-destructive">
            Failed to load workspace members.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-3" />

            <p className="text-sm font-medium">
              No members found
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead className="w-12 pl-6">
                  <Checkbox />
                </TableHead>

                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right pr-6">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="pl-6">
                    <Checkbox />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="font-medium">
                        {user.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>

                  <TableCell>
                    {getRoleLabel(user.role)}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    —
                  </TableCell>

                  <TableCell>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(
                        user.isActive,
                      )}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />

                      {user.isActive
                        ? "Active"
                        : "Inactive"}
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 opacity-50" />

                      {new Date(
                        user.createdAt,
                      ).toLocaleDateString(
                        undefined,
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredUsers.length} of{" "}
          {users.length} members
        </div>
      </div>

      {/* Add Member */}
      <Dialog
        open={isAddUserOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseAddUser();
          } else {
            setIsAddUserOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Add Team Member
            </DialogTitle>

            <DialogDescription className="text-muted-foreground">
              Create a user account and assign their
              workspace role.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(
              handleAddUser,
            )}
          >
            <div className="space-y-4 py-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="name"
                  placeholder="Enter full name"
                  className="bg-background"
                  {...register("name")}
                />

                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="bg-background"
                  {...register("email")}
                />

                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="Enter initial password"
                  autoComplete="new-password"
                  className="bg-background"
                  {...register("password")}
                />

                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>
                  Role{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Select
                  value={selectedRole}
                  onValueChange={(value) =>
                    setValue(
                      "role",
                      value as
                        | "admin"
                        | "member",
                      {
                        shouldValidate: true,
                      },
                    )
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="admin">
                      Admin
                    </SelectItem>

                    <SelectItem value="member">
                      Member
                    </SelectItem>
                  </SelectContent>
                </Select>

                {errors.role && (
                  <p className="text-xs text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Must Change Password */}
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="mustChangePassword"
                    checked={mustChangePassword}
                    onCheckedChange={(checked) =>
                      setValue(
                        "mustChangePassword",
                        checked === true,
                        {
                          shouldValidate: true,
                        },
                      )
                    }
                  />

                  <div className="space-y-1">
                    <Label
                      htmlFor="mustChangePassword"
                      className="cursor-pointer"
                    >
                      Require password change on first
                      login
                    </Label>

                    <p className="text-xs text-muted-foreground">
                      The user will be redirected to the
                      account setup screen after signing
                      in.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddUser}
                disabled={
                  isAddingUser ||
                  isSubmitting
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  isAddingUser ||
                  isSubmitting
                }
              >
                {isAddingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}