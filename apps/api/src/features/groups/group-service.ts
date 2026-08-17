import type { CreateGroupSchema, UpdateGroupSchema } from "@bastion/schemas";
import {
  addGroupMember,
  addGroupServer,
  createGroup as createGroupRepository,
  deleteGroup as deleteGroupRepository,
  findGroupById,
  findServerInWorkspace,
  findUserInWorkspace,
  listGroupMembers,
  listGroupServers,
  listGroups as listGroupsRepository,
  removeGroupMember,
  removeGroupServer,
  updateGroup as updateGroupRepository,
} from "./group-repository.js";
import BadRequestError from "../../core/errors/bad-request.js";
import NotFoundError from "../../core/errors/not-found.js";

export const createGroup = async (
  workspaceId: string,
  data: CreateGroupSchema,
) => {
  try {
    return await createGroupRepository(workspaceId, data);
  } catch (error: any) {
    // PostgreSQL unique violation
    if (error?.code === "23505") {
      throw new BadRequestError(
        "A group with this name already exists in this workspace.",
      );
    }

    throw error;
  }
};

export const getGroup = async (groupId: string, workspaceId: string) => {
  const group = await findGroupById(groupId, workspaceId);

  if (!group) {
    throw new NotFoundError("Group not found.");
  }

  return group;
};

export const getGroups = async (workspaceId: string) => {
  return listGroupsRepository(workspaceId);
};

export const updateGroup = async (
  groupId: string,
  workspaceId: string,
  data: UpdateGroupSchema,
) => {
  try {
    const group = await updateGroupRepository(groupId, workspaceId, data);

    if (!group) {
      throw new NotFoundError("Group not found.");
    }

    return group;
  } catch (error: any) {
    if (error?.code === "23505") {
      throw new BadRequestError(
        "A group with this name already exists in this workspace.",
      );
    }

    throw error;
  }
};

export const deleteGroup = async (
  groupId: string,
  workspaceId: string,
): Promise<void> => {
  const deleted = await deleteGroupRepository(groupId, workspaceId);

  if (!deleted) {
    throw new NotFoundError("Group not found.");
  }
};

export const addMemberToGroup = async (
  groupId: string,
  userId: string,
  workspaceId: string,
): Promise<void> => {
  const group = await findGroupById(groupId, workspaceId);

  if (!group) {
    throw new NotFoundError("Group not found.");
  }

  const userExists = await findUserInWorkspace(userId, workspaceId);

  if (!userExists) {
    throw new BadRequestError("User does not belong to this workspace.");
  }

  await addGroupMember(groupId, userId);
};

export const removeMemberFromGroup = async (
  groupId: string,
  userId: string,
  workspaceId: string,
): Promise<void> => {
  const group = await findGroupById(groupId, workspaceId);

  if (!group) {
    throw new NotFoundError("Group not found.");
  }

  const removed = await removeGroupMember(groupId, userId);

  if (!removed) {
    throw new NotFoundError("User is not a member of this group.");
  }
};

export const getGroupMembers = async (
  groupId: string,
  workspaceId: string,
) => {
  const group = await findGroupById(groupId, workspaceId);

  if (!group) {
    throw new NotFoundError("Group not found.");
  }

  return listGroupMembers(groupId);
};

export const addServerToGroup = async (
  groupId: string,
  serverId: string,
  workspaceId: string,
): Promise<void> => {
  const group = await findGroupById(groupId, workspaceId);

  if (!group) {
    throw new NotFoundError("Group not found.");
  }

  const serverExists = await findServerInWorkspace(
    serverId,
    workspaceId,
  );

  if (!serverExists) {
    throw new BadRequestError(
      "Server does not belong to this workspace.",
    );
  }

  await addGroupServer(groupId, serverId);
};

export const removeServerFromGroup = async (
  groupId: string,
  serverId: string,
  workspaceId: string,
): Promise<void> => {
  const group = await findGroupById(groupId, workspaceId);

  if (!group) {
    throw new NotFoundError("Group not found.");
  }

  const removed = await removeGroupServer(groupId, serverId);

  if (!removed) {
    throw new NotFoundError(
      "Server is not assigned to this group.",
    );
  }
};

export const getGroupServers = async (
  groupId: string,
  workspaceId: string,
) => {
  const group = await findGroupById(groupId, workspaceId);

  if (!group) {
    throw new NotFoundError("Group not found.");
  }

  return listGroupServers(groupId);
};