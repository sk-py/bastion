import type { LoginSchema } from "@bastion/schemas";
import { api } from "./axios";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const data = await api.post<Promise<MeResponse>>("/auth/login", input);
  return data.data;
};

export const logout = async () => {
  await api.get<Promise<LogoutResponse>>("/auth/logout");
};
