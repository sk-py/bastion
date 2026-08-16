import type { AddUserSchema, UpdateUserSchema } from "@bastion/schemas";
import { api } from "./axios";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  isActive: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const getWorkspaceUsers = async () => {
  const { data } = await api.get<ApiResponse<WorkspaceUser[]>>(
    "/workspace/users",
  );

  return data.data;
};

export const addUser = async (
  input: AddUserSchema,
) => {
  const { data } = await api.post<
    ApiResponse<WorkspaceUser>
  >("/auth/add-user", input);

  return data.data;
};

export const updateUser = async (
  userId: string,
  input: UpdateUserSchema,
) => {
  const { data } = await api.patch<ApiResponse<WorkspaceUser>>(
    `/auth/users/${userId}`,
    input,
  );

  return data.data;
};

export const updateUserStatus = async (
  userId: string,
  isActive: boolean,
) => {
  const { data } = await api.patch<ApiResponse<WorkspaceUser>>(
    `/auth/users/${userId}/status`,
    { isActive },
  );

  return data.data;
};