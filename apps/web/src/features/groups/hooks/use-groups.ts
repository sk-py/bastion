import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  addGroupMember,
  addGroupServer,
  createGroup,
  deleteGroup,
  getGroupMembers,
  getGroups,
  getGroupServers,
  getWorkspaceServers,
  getWorkspaceUsers,
  removeGroupMember,
  removeGroupServer,
  updateGroup,
} from "@/api/groups";

export const groupKeys = {
  all: ["groups"] as const,
  list: () => [...groupKeys.all, "list"] as const,
  detail: (groupId: string) =>
    [...groupKeys.all, "detail", groupId] as const,
  members: (groupId: string) =>
    [...groupKeys.all, "members", groupId] as const,
  servers: (groupId: string) =>
    [...groupKeys.all, "servers", groupId] as const,
};

export const useGroups = () =>
  useQuery({
    queryKey: groupKeys.list(),
    queryFn: getGroups,
  });

export const useGroupMembers = (groupId?: string) =>
  useQuery({
    queryKey: groupKeys.members(groupId!),
    queryFn: () => getGroupMembers(groupId!),
    enabled: !!groupId,
  });

export const useGroupServers = (groupId?: string) =>
  useQuery({
    queryKey: groupKeys.servers(groupId!),
    queryFn: () => getGroupServers(groupId!),
    enabled: !!groupId,
  });

export const useWorkspaceUsers = (enabled = true) =>
  useQuery({
    queryKey: ["workspace", "users"],
    queryFn: getWorkspaceUsers,
    enabled,
  });

export const useWorkspaceServers = (enabled = true) =>
  useQuery({
    queryKey: ["workspace", "servers"],
    queryFn: getWorkspaceServers,
    enabled,
  });

export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.list(),
      });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: Parameters<typeof updateGroup>[1];
    }) => updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.list(),
      });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.list(),
      });
    },
  });
};

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }) => addGroupMember(groupId, { userId }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.members(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: groupKeys.list(),
      });
    },
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }) => removeGroupMember(groupId, userId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.members(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: groupKeys.list(),
      });
    },
  });
};

export const useAddGroupServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      serverId,
    }: {
      groupId: string;
      serverId: string;
    }) => addGroupServer(groupId, serverId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.servers(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: groupKeys.list(),
      });
    },
  });
};

export const useRemoveGroupServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      serverId,
    }: {
      groupId: string;
      serverId: string;
    }) => removeGroupServer(groupId, serverId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.servers(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: groupKeys.list(),
      });
    },
  });
};