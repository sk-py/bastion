import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addServer,
  deleteServer,
  getAllServers,
  testServerConnection,
  updateServer,
} from "@/api/server";

export const useServers = () => {
  return useQuery({
    queryKey: ["servers"],
    queryFn: getAllServers,
    refetchOnWindowFocus: false,
  });
};

export const useAddServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      toast.success("Server added successfully");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Failed to add server",
      );
    },
  });
};

export const useUpdateServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      toast.success("Server updated successfully");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Failed to update server",
      );
    },
  });
};

export const useDeleteServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      toast.success("Server deleted successfully");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Failed to delete server",
      );
    },
  });
};

export const useTestServerConnection = () => {
  return useMutation({
    mutationFn: testServerConnection,
    onSuccess: (res) => {
      toast.success(
        res.data?.message ||
          "Connection successful",
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          "Connection failed",
      );
    },
  });
};