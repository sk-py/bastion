import type { Request, Response } from "express";
import type { CreateGroupSchema, UpdateGroupSchema } from "@bastion/schemas";
import {
  addMemberToGroup,
  createGroup,
  deleteGroup,
  getGroup,
  getGroupMembers,
  getGroups,
  removeMemberFromGroup,
  updateGroup,
} from "./group-service.js";

export const create = async (req: Request, res: Response) => {
  const data = req.body as CreateGroupSchema;

  const group = await createGroup(req.user.workspaceId, data);

  return res.status(201).json({
    status: "success",
    data: group,
  });
};

export const list = async (req: Request, res: Response) => {
  const groups = await getGroups(req.user.workspaceId);

  return res.status(200).json({
    status: "success",
    data: groups,
  });
};

export const get = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const group = await getGroup(id, req.user.workspaceId);

  return res.status(200).json({
    status: "success",
    data: group,
  });
};

export const update = async (req: Request, res: Response) => {
  const data = req.body as UpdateGroupSchema;
  const { id } = req.params as { id: string };

  const group = await updateGroup(id, req.user.workspaceId, data);

  return res.status(200).json({
    status: "success",
    data: group,
  });
};

export const remove = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  await deleteGroup(id, req.user.workspaceId);

  return res.status(200).json({
    status: "success",
    message: "Group deleted successfully.",
  });
};

export const addMember = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  await addMemberToGroup(id, req.body.userId, req.user.workspaceId);

  return res.status(201).json({
    status: "success",
    message: "User added to group successfully.",
  });
};

export const removeMember = async (req: Request, res: Response) => {
  const { userId, id: groupId } = req.params as { userId: string; id: string };
  await removeMemberFromGroup(groupId, userId, req.user.workspaceId);

  return res.status(200).json({
    status: "success",
    message: "User removed from group successfully.",
  });
};

export const listMembers = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params as { id: string };

  const members = await getGroupMembers(
    id,
    req.user.workspaceId,
  );

  return res.status(200).json({
    status: "success",
    data: members,
  });
};