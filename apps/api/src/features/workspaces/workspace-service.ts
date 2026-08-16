import { listWorkspaceServers, listWorkspaceUsers } from "./workspace-repository.js";

export const getWorkspaceUsers = async (workspaceId: string) => {
  return listWorkspaceUsers(workspaceId);
};

export const getWorkspaceServers = async (
  workspaceId: string,
) => {
  return listWorkspaceServers(workspaceId);
};