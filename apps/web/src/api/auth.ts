import type { InitialSetupSchema, LoginSchema } from "@bastion/schemas";
import { api } from "./axios";
import axios from "axios";

export const completeInitialSetup = async (input: InitialSetupSchema) => {
  const { data } = await api.patch<MeResponse>("/auth/setup", input);
  return data.data;
};

export interface CurrentUser {
  id: string;
  workspaceId: string;
  workspaceName: string;
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

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const { data } = await api.get<MeResponse>("/auth/me");

    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }

    throw error;
  }
};

export const login = async (input: LoginSchema) => {
  const { data } = await api.post<MeResponse>("/auth/login", input);

  return data.data;
};

export const logout = async () => {
  await api.get<LogoutResponse>("/auth/logout");
};
