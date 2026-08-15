import type { InitialSetupSchema, LoginSchema } from "@bastion/schemas";
import { api } from "./axios";

export const completeInitialSetup = async (input: InitialSetupSchema) => {
  const { data } = await api.patch<MeResponse>("/auth/setup", input);
  return data.data;
};

export interface CurrentUser {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeResponse {
  status: string;
  data: CurrentUser;
}

export interface LogoutResponse {
  status: string;
  message: string;
}

export const getCurrentUser = async () => {
  const { data } = await api.get<MeResponse>("/auth/me");

  return data.data;
};

export const login = async (input: LoginSchema) => {
  const { data } = await api.post<MeResponse>("/auth/login", input);

  return data.data;
};

export const logout = async () => {
  await api.get<LogoutResponse>("/auth/logout");
};
