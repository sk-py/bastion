import {
  addUser,
  getWorkspaceUsers,
  updateUser,
  updateUserStatus,
} from "@/api/users";
import type { UpdateUserSchema } from "@bastion/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const userKeys = {
  all: ["workspace", "users"] as const,
};

export const useWorkspaceUsers = () =>
  useQuery({
    queryKey: userKeys.all,
    queryFn: getWorkspaceUsers,
  });

export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
      });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserSchema;
    }) => updateUser(userId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
      });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => updateUserStatus(userId, isActive),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
      });
    },
  });
};