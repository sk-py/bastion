import type { CreateServerSchema, UpdateServerSchema } from "@bastion/schemas";
import { api } from "./axios";

export const getAllServers = async () => {
  const res = await api.get("/server/all");
  return res.data.data;
};

export const addServer = async (data: CreateServerSchema) =>
  api.post("/server/add", data);

export const updateServer = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateServerSchema;
}) => api.patch(`/server/update/${id}`, data);

export const testServerConnection = async (id: string) =>
  api.post(`/server/${id}/test`);


export const getServerById = async (id: string) => {
  const res = await api.get(`/server/${id}`);
  return res.data.data;
}