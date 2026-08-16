import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Plus,
  Users,
  Server,
  Trash2,
  Shield,
  FolderKey,
  MoreVertical,
  Monitor,
  Pencil,
  Loader2,
} from "lucide-react";

import {
  createGroupSchema,
  updateGroupSchema,
  type CreateGroupSchema,
  type UpdateGroupSchema,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  groupKeys,
  useAddGroupMember,
  useAddGroupServer,
  useCreateGroup,
  useDeleteGroup,
  useGroupMembers,
  useGroupServers,
  useGroups,
  useRemoveGroupMember,
  useRemoveGroupServer,
  useUpdateGroup,
  useWorkspaceServers,
  useWorkspaceUsers,
} from "./hooks/use-groups";

import { useQueryClient } from "@tanstack/react-query";

export default function GroupsPage() {
  const queryClient = useQueryClient();

  /*
   * ------------------------------------------------------------
   * Groups
   * ------------------------------------------------------------
   */

  const {
    data: groups = [],
    isPending: isGroupsPending,
    isError: isGroupsError,
  } = useGroups();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(
    null,
  );

  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ?? null;

  useEffect(() => {
    if (groups.length === 0) {
      setActiveGroupId(null);
      return;
    }

    if (
      !activeGroupId ||
      !groups.some((group) => group.id === activeGroupId)
    ) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  /*
   * ------------------------------------------------------------
   * Tabs / search
   * ------------------------------------------------------------
   */

  const [activeTab, setActiveTab] = useState<
    "users" | "servers"
  >("users");

  const [groupSearch, setGroupSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [serverSearch, setServerSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();

    if (!query) return groups;

    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query),
    );
  }, [groups, groupSearch]);

  /*
   * ------------------------------------------------------------
   * Group details
   * ------------------------------------------------------------
   */

  const {
    data: members = [],
    isPending: isMembersPending,
    isError: isMembersError,
  } = useGroupMembers(activeGroupId ?? undefined);

  const {
    data: groupServers = [],
    isPending: isGroupServersPending,
    isError: isGroupServersError,
  } = useGroupServers(activeGroupId ?? undefined);

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    if (!query) return members;

    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query),
    );
  }, [members, memberSearch]);

  const filteredGroupServers = useMemo(() => {
    const query = serverSearch.trim().toLowerCase();

    if (!query) return groupServers;

    return groupServers.filter(
      (server) =>
        server.name.toLowerCase().includes(query) ||
        server.host.toLowerCase().includes(query) ||
        server.operatingSystem
          ?.toLowerCase()
          .includes(query),
    );
  }, [groupServers, serverSearch]);

  /*
   * ------------------------------------------------------------
   * Modal states
   * ------------------------------------------------------------
   */

  const [isCreateGroupOpen, setIsCreateGroupOpen] =
    useState(false);

  const [isEditGroupOpen, setIsEditGroupOpen] =
    useState(false);

  const [isDeleteGroupOpen, setIsDeleteGroupOpen] =
    useState(false);

  const [isAddUserOpen, setIsAddUserOpen] =
    useState(false);

  const [isAssignServerOpen, setIsAssignServerOpen] =
    useState(false);

  /*
   * ------------------------------------------------------------
   * Create group
   * ------------------------------------------------------------
   */

  const {
    register: registerCreateGroup,
    handleSubmit: handleSubmitCreateGroup,
    reset: resetCreateGroup,
    formState: {
      errors: createGroupErrors,
      isSubmitting: isCreateSubmitting,
    },
  } = useForm<CreateGroupSchema>({
    resolver: zodResolver(createGroupSchema,
    ),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const {
    mutateAsync: createGroup,
    isPending: isCreatingGroup,
  } = useCreateGroup();

  const handleCreateGroup = async (
    values: CreateGroupSchema,
  ) => {
    const group = await createGroup(values);

    resetCreateGroup();
    setIsCreateGroupOpen(false);
    setActiveGroupId(group.id);
    setActiveTab("users");
  };

  /*
   * ------------------------------------------------------------
   * Edit group
   * ------------------------------------------------------------
   */

  const {
    register: registerEditGroup,
    handleSubmit: handleSubmitEditGroup,
    reset: resetEditGroup,
    formState: {
      errors: editGroupErrors,
      isSubmitting: isEditSubmitting,
    },
  } = useForm<UpdateGroupSchema>({
    resolver: zodResolver(updateGroupSchema,
    ),
  });

  const {
    mutateAsync: updateGroup,
    isPending: isUpdatingGroup,
  } = useUpdateGroup();

  useEffect(() => {
    if (!activeGroup || !isEditGroupOpen) return;

    resetEditGroup({
      name: activeGroup.name,
      description: activeGroup.description ?? "",
    });
  }, [activeGroup, isEditGroupOpen, resetEditGroup]);

  const handleUpdateGroup = async (
    values: UpdateGroupSchema,
  ) => {
    if (!activeGroup) return;

    await updateGroup({
      groupId: activeGroup.id,
      data: values,
    });

    setIsEditGroupOpen(false);
  };

  /*
   * ------------------------------------------------------------
   * Delete group
   * ------------------------------------------------------------
   */

  const {
    mutateAsync: deleteGroup,
    isPending: isDeletingGroup,
  } = useDeleteGroup();

  const handleDeleteGroup = async () => {
    if (!activeGroup) return;

    const deletedId = activeGroup.id;

    await deleteGroup(deletedId);

    setIsDeleteGroupOpen(false);

    const remainingGroups = groups.filter(
      (group) => group.id !== deletedId,
    );

    setActiveGroupId(
      remainingGroups.length > 0
        ? remainingGroups[0].id
        : null,
    );
  };

  /*
   * ------------------------------------------------------------
   * Workspace resources
   * ------------------------------------------------------------
   */

  const {
    data: workspaceUsers = [],
    isPending: isWorkspaceUsersPending,
  } = useWorkspaceUsers(isAddUserOpen);

  const {
    data: workspaceServers = [],
    isPending: isWorkspaceServersPending,
  } = useWorkspaceServers(isAssignServerOpen);

  /*
   * ------------------------------------------------------------
   * Add users
   * ------------------------------------------------------------
   */

  const [selectedUserIds, setSelectedUserIds] = useState<
    Set<string>
  >(new Set());

  const [availableUserSearch, setAvailableUserSearch] =
    useState("");

  const {
    mutateAsync: addMember,
    isPending: isAddingMember,
  } = useAddGroupMember();

  useEffect(() => {
    if (!isAddUserOpen) {
      setSelectedUserIds(new Set());
      setAvailableUserSearch("");
    }
  }, [isAddUserOpen]);

  const availableUsers = useMemo(() => {
    if (!activeGroup) return [];

    const existingIds = new Set(
      members.map((member) => member.id),
    );

    const query = availableUserSearch.trim().toLowerCase();

    return workspaceUsers.filter((user) => {
      if (existingIds.has(user.id)) return false;

      if (!query) return true;

      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [
    activeGroup,
    members,
    workspaceUsers,
    availableUserSearch,
  ]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const handleAddUsers = async () => {
    if (!activeGroup || selectedUserIds.size === 0) {
      return;
    }

    await Promise.all(
      Array.from(selectedUserIds).map((userId) =>
        addMember({
          groupId: activeGroup.id,
          userId,
        }),
      ),
    );

    setSelectedUserIds(new Set());
    setIsAddUserOpen(false);

    await queryClient.invalidateQueries({
      queryKey: groupKeys.members(activeGroup.id),
    });
  };

  /*
   * ------------------------------------------------------------
   * Remove user
   * ------------------------------------------------------------
   */

  const {
    mutateAsync: removeMember,
    isPending: isRemovingMember,
  } = useRemoveGroupMember();

  const handleRemoveMember = async (userId: string) => {
    if (!activeGroup) return;

    await removeMember({
      groupId: activeGroup.id,
      userId,
    });
  };

  /*
   * ------------------------------------------------------------
   * Assign servers
   * ------------------------------------------------------------
   */

  const [selectedServerIds, setSelectedServerIds] =
    useState<Set<string>>(new Set());

  const [availableServerSearch, setAvailableServerSearch] =
    useState("");

  const {
    mutateAsync: addServer,
    isPending: isAddingServer,
  } = useAddGroupServer();

  useEffect(() => {
    if (!isAssignServerOpen) {
      setSelectedServerIds(new Set());
      setAvailableServerSearch("");
    }
  }, [isAssignServerOpen]);

  const availableServers = useMemo(() => {
    if (!activeGroup) return [];

    const existingIds = new Set(
      groupServers.map((server) => server.id),
    );

    const query = availableServerSearch.trim().toLowerCase();

    return workspaceServers.filter((server) => {
      if (existingIds.has(server.id)) return false;

      if (!query) return true;

      return (
        server.name.toLowerCase().includes(query) ||
        server.host.toLowerCase().includes(query) ||
        server.operatingSystem
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [
    activeGroup,
    groupServers,
    workspaceServers,
    availableServerSearch,
  ]);

  const toggleServerSelection = (serverId: string) => {
    setSelectedServerIds((current) => {
      const next = new Set(current);

      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }

      return next;
    });
  };

  const handleAssignServers = async () => {
    if (!activeGroup || selectedServerIds.size === 0) {
      return;
    }

    await Promise.all(
      Array.from(selectedServerIds).map((serverId) =>
        addServer({
          groupId: activeGroup.id,
          serverId,
        }),
      ),
    );

    setSelectedServerIds(new Set());
    setIsAssignServerOpen(false);

    await queryClient.invalidateQueries({
      queryKey: groupKeys.servers(activeGroup.id),
    });
  };

  /*
   * ------------------------------------------------------------
   * Revoke server
   * ------------------------------------------------------------
   */

  const {
    mutateAsync: removeServer,
    isPending: isRemovingServer,
  } = useRemoveGroupServer();

  const handleRemoveServer = async (
    serverId: string,
  ) => {
    if (!activeGroup) return;

    await removeServer({
      groupId: activeGroup.id,
      serverId,
    });
  };

  /*
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */

  return (
    <div className="p-8 w-full bg-background min-h-screen text-foreground space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Access Groups
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Manage role-based groups, assign users, and map
            server access.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateGroupOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Master Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        {/* Groups */}
        <div className="lg:col-span-4 xl:col-span-3 border rounded-xl bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search groups..."
                className="pl-9 bg-background"
                value={groupSearch}
                onChange={(event) =>
                  setGroupSearch(event.target.value)
                }
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isGroupsPending ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading groups...
              </div>
            ) : isGroupsError ? (
              <div className="p-4 text-sm text-destructive">
                Failed to load groups.
              </div>
            ) : groups.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No groups created yet.
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No groups match your search.
              </div>
            ) : (
              filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() =>
                    setActiveGroupId(group.id)
                  }
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeGroupId === group.id
                      ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                      : "bg-transparent border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderKey
                        className={`w-4 h-4 ${
                          activeGroupId === group.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />

                      <span
                        className={`font-medium text-sm ${
                          activeGroupId === group.id
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {group.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    {activeGroupId === group.id ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {members.length}
                        </span>

                        <span className="flex items-center gap-1">
                          <Server className="w-3 h-3" />
                          {groupServers.length}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          —
                        </span>

                        <span className="flex items-center gap-1">
                          <Server className="w-3 h-3" />
                          —
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Details */}
        {activeGroup ? (
          <div className="lg:col-span-8 xl:col-span-9 border rounded-xl bg-card flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-start bg-muted/10">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {activeGroup.name}
                  <Shield className="w-4 h-4 text-primary" />
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  {activeGroup.description ||
                    "No description."}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => setIsEditGroupOpen(true)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-border">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "users"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Members ({members.length})
                </button>

                <button
                  onClick={() =>
                    setActiveTab("servers")
                  }
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "servers"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Assigned Servers ({groupServers.length})
                </button>
              </div>
            </div>

            {/* Members */}
            {activeTab === "users" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-muted/10 border-b border-border">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                    <Input
                      placeholder="Search members..."
                      className="pl-9 h-9 bg-background"
                      value={memberSearch}
                      onChange={(event) =>
                        setMemberSearch(
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={() =>
                      setIsAddUserOpen(true)
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  {isMembersPending ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      Loading members...
                    </div>
                  ) : isMembersError ? (
                    <div className="p-6 text-sm text-destructive">
                      Failed to load members.
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      No members in this group.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/30">
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>
                            System Role
                          </TableHead>
                          <TableHead className="text-right">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredMembers.map((member) => (
                          <TableRow
                            key={member.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {member.name
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <span className="font-medium text-sm">
                                  {member.name}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-muted-foreground text-sm">
                              {member.email}
                            </TableCell>

                            <TableCell className="text-sm capitalize">
                              {member.role}
                            </TableCell>

                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  isRemovingMember
                                }
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleRemoveMember(
                                    member.id,
                                  )
                                }
                              >
                                {isRemovingMember ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}

            {/* Servers */}
            {activeTab === "servers" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-muted/10 border-b border-border">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                    <Input
                      placeholder="Search servers..."
                      className="pl-9 h-9 bg-background"
                      value={serverSearch}
                      onChange={(event) =>
                        setServerSearch(
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={() =>
                      setIsAssignServerOpen(true)
                    }
                  >
                    <Server className="w-4 h-4 mr-2" />
                    Assign Server
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  {isGroupServersPending ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      Loading servers...
                    </div>
                  ) : isGroupServersError ? (
                    <div className="p-6 text-sm text-destructive">
                      Failed to load servers.
                    </div>
                  ) : filteredGroupServers.length ===
                    0 ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      No servers assigned to this group.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/30">
                          <TableHead>
                            Server Name
                          </TableHead>
                          <TableHead>
                            Host IP
                          </TableHead>
                          <TableHead>OS</TableHead>
                          <TableHead className="text-right">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredGroupServers.map(
                          (server) => (
                            <TableRow
                              key={server.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-medium text-sm">
                                <div className="flex items-center gap-2">
                                  <Monitor className="w-4 h-4 text-muted-foreground" />
                                  {server.name}
                                </div>
                              </TableCell>

                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {server.host}
                              </TableCell>

                              <TableCell className="text-sm">
                                {server.operatingSystem ??
                                  "Unknown"}
                              </TableCell>

                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={
                                    isRemovingServer
                                  }
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    handleRemoveServer(
                                      server.id,
                                    )
                                  }
                                >
                                  {isRemovingServer ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                  )}
                                  Revoke
                                </Button>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 xl:col-span-9 border rounded-xl bg-card flex items-center justify-center">
            <div className="text-center">
              <FolderKey className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Select a group to view its details.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* CREATE GROUP                                           */}
      {/* ====================================================== */}

      <Dialog
        open={isCreateGroupOpen}
        onOpenChange={(open) => {
          setIsCreateGroupOpen(open);

          if (!open) {
            resetCreateGroup();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>
              Create New Group
            </DialogTitle>

            <DialogDescription>
              Create a new access group to manage
              permissions collectively.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitCreateGroup(
              handleCreateGroup,
            )}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-group-name">
                  Group Name{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="create-group-name"
                  placeholder="e.g. Database Admins"
                  className="bg-background"
                  {...registerCreateGroup("name")}
                />

                {createGroupErrors.name && (
                  <p className="text-xs text-destructive">
                    {
                      createGroupErrors.name
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-group-description">
                  Description
                </Label>

                <Textarea
                  id="create-group-description"
                  placeholder="Brief description of this group's purpose"
                  className="bg-background resize-none h-20"
                  {...registerCreateGroup(
                    "description",
                  )}
                />

                {createGroupErrors.description && (
                  <p className="text-xs text-destructive">
                    {
                      createGroupErrors
                        .description.message
                    }
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetCreateGroup();
                  setIsCreateGroupOpen(false);
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  isCreateSubmitting ||
                  isCreatingGroup
                }
              >
                {isCreatingGroup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* EDIT GROUP                                             */}
      {/* ====================================================== */}

      <Dialog
        open={isEditGroupOpen}
        onOpenChange={setIsEditGroupOpen}
      >
        <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>

            <DialogDescription>
              Update the group's name or description.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitEditGroup(
              handleUpdateGroup,
            )}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">
                  Group Name{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="edit-group-name"
                  className="bg-background"
                  {...registerEditGroup("name")}
                />

                {editGroupErrors.name && (
                  <p className="text-xs text-destructive">
                    {editGroupErrors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-group-description">
                  Description
                </Label>

                <Textarea
                  id="edit-group-description"
                  className="bg-background resize-none h-20"
                  {...registerEditGroup(
                    "description",
                  )}
                />

                {editGroupErrors.description && (
                  <p className="text-xs text-destructive">
                    {
                      editGroupErrors
                        .description.message
                    }
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setIsEditGroupOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  isEditSubmitting ||
                  isUpdatingGroup
                }
              >
                {isUpdatingGroup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* DELETE GROUP                                           */}
      {/* ====================================================== */}

      <Dialog
        open={isDeleteGroupOpen}
        onOpenChange={setIsDeleteGroupOpen}
      >
        <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>
              Delete {activeGroup?.name}?
            </DialogTitle>

            <DialogDescription>
              This will delete the group and remove its
              member and server assignments. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setIsDeleteGroupOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={isDeletingGroup}
              onClick={handleDeleteGroup}
            >
              {isDeletingGroup ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* ADD MEMBERS                                            */}
      {/* ====================================================== */}

      <Dialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
      >
        <DialogContent className="sm:max-w-[500px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>
              Add Members to{" "}
              {activeGroup?.name ?? "Group"}
            </DialogTitle>

            <DialogDescription>
              Select users from your workspace to add to
              this group.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search users..."
                className="pl-9 bg-background"
                value={availableUserSearch}
                onChange={(event) =>
                  setAvailableUserSearch(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
              {isWorkspaceUsersPending ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Loading users...
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No available users.
                </div>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 hover:bg-muted/50 border-b border-border last:border-0"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUserIds.has(
                        user.id,
                      )}
                      onCheckedChange={() =>
                        toggleUserSelection(user.id)
                      }
                    />

                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex items-center gap-3 cursor-pointer w-full font-normal"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {user.name
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {user.name}
                        </span>

                        <span className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>

                      <span className="ml-auto text-xs text-muted-foreground capitalize">
                        {user.role}
                      </span>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setIsAddUserOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              disabled={
                selectedUserIds.size === 0 ||
                isAddingMember
              }
              onClick={handleAddUsers}
            >
              {isAddingMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add Selected${
                  selectedUserIds.size > 0
                    ? ` (${selectedUserIds.size})`
                    : ""
                }`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* ASSIGN SERVERS                                         */}
      {/* ====================================================== */}

      <Dialog
        open={isAssignServerOpen}
        onOpenChange={setIsAssignServerOpen}
      >
        <DialogContent className="sm:max-w-[600px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>
              Assign Servers to{" "}
              {activeGroup?.name ?? "Group"}
            </DialogTitle>

            <DialogDescription>
              Grant this group access to specific
              workspace servers.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search servers by name or IP..."
                className="pl-9 bg-background"
                value={availableServerSearch}
                onChange={(event) =>
                  setAvailableServerSearch(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
              {isWorkspaceServersPending ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Loading servers...
                </div>
              ) : availableServers.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No available servers.
                </div>
              ) : (
                availableServers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center space-x-3 p-3 hover:bg-muted/50 border-b border-border last:border-0"
                  >
                    <Checkbox
                      id={`server-${server.id}`}
                      checked={selectedServerIds.has(
                        server.id,
                      )}
                      onCheckedChange={() =>
                        toggleServerSelection(
                          server.id,
                        )
                      }
                    />

                    <Label
                      htmlFor={`server-${server.id}`}
                      className="flex items-center justify-between cursor-pointer w-full font-normal"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {server.name}
                        </span>

                        <span className="font-mono text-xs text-muted-foreground">
                          {server.host}:{server.port}
                        </span>
                      </div>

                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                        {server.operatingSystem ??
                          "Unknown"}
                      </span>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setIsAssignServerOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              disabled={
                selectedServerIds.size === 0 ||
                isAddingServer
              }
              onClick={handleAssignServers}
            >
              {isAddingServer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign Selected${
                  selectedServerIds.size > 0
                    ? ` (${selectedServerIds.size})`
                    : ""
                }`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}