import { completeInitialSetup } from "@/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useInitialSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeInitialSetup,

    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
    },
  });
};
