import type {
  CreateGroupSchema,
  UpdateGroupSchema,
  GroupMemberSchema,
} from "@bastion/schemas";
import { api } from "./axios";

export interface Group {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
}

export interface GroupServer {
  id: string;
  name: string;
  host: string;
  operatingSystem: string | null;
}

export interface WorkspaceUserGroup {
  id: string;
  name: string;
}
export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member" | "owner";
  isActive: boolean;
  createdAt: Date;
  groups: WorkspaceUserGroup[];
}

export interface WorkspaceServer {
  id: string;
  name: string;
  host: string;
  port: number;
  operatingSystem: string | null;
  architecture: string | null;
  status: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const getGroups = async () => {
  const { data } = await api.get<ApiResponse<Group[]>>("/groups");
  return data.data;
};

export const getGroupMembers = async (groupId: string) => {
  const { data } = await api.get<ApiResponse<GroupMember[]>>(
    `/groups/${groupId}/members`,
  );
  return data.data;
};

export const getGroupServers = async (groupId: string) => {
  const { data } = await api.get<ApiResponse<GroupServer[]>>(
    `/groups/${groupId}/servers`,
  );
  return data.data;
};

export const createGroup = async (input: CreateGroupSchema) => {
  const { data } = await api.post<ApiResponse<Group>>("/groups", input);
  return data.data;
};

export const updateGroup = async (
  groupId: string,
  input: UpdateGroupSchema,
) => {
  const { data } = await api.patch<ApiResponse<Group>>(
    `/groups/${groupId}`,
    input,
  );
  return data.data;
};

export const deleteGroup = async (groupId: string) => {
  await api.delete(`/groups/${groupId}`);
};

export const addGroupMember = async (
  groupId: string,
  input: GroupMemberSchema,
) => {
  await api.post(`/groups/${groupId}/members`, input);
};

export const removeGroupMember = async (groupId: string, userId: string) => {
  await api.delete(`/groups/${groupId}/members/${userId}`);
};

export const addGroupServer = async (groupId: string, serverId: string) => {
  await api.post(`/groups/${groupId}/servers`, {
    serverId,
  });
};

export const removeGroupServer = async (groupId: string, serverId: string) => {
  await api.delete(`/groups/${groupId}/servers/${serverId}`);
};

export const getWorkspaceUsers = async () => {
  const { data } =
    await api.get<ApiResponse<WorkspaceUser[]>>("/workspace/users");

  return data.data;
};

export const getWorkspaceServers = async () => {
  const { data } =
    await api.get<ApiResponse<WorkspaceServer[]>>("/workspace/servers");

  return data.data;
};
