import {
  addUser,
  getWorkspaceUsers,
} from "@/api/users";
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