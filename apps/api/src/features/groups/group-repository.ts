import type { CreateGroupSchema, UpdateGroupSchema } from "@bastion/schemas";
import pool from "src/db/pool.js";
import type { UserRole } from "../auth/local/auth-types.js";

export interface Group {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const GROUP_SELECT = `
  id,
  workspace_id AS "workspaceId",
  name,
  description,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const createGroup = async (
  workspaceId: string,
  data: CreateGroupSchema,
): Promise<Group> => {
  const { rows } = await pool.query<Group>(
    `
      INSERT INTO groups (
        workspace_id,
        name,
        description
      )
      VALUES ($1, $2, $3)
      RETURNING ${GROUP_SELECT}
    `,
    [workspaceId, data.name, data.description ?? null],
  );

  return rows[0]!;
};

export const findGroupById = async (
  groupId: string,
  workspaceId: string,
): Promise<Group | null> => {
  const { rows } = await pool.query<Group>(
    `
      SELECT ${GROUP_SELECT}
      FROM groups
      WHERE id = $1
        AND workspace_id = $2
      LIMIT 1
    `,
    [groupId, workspaceId],
  );

  return rows[0] ?? null;
};

export const listGroups = async (workspaceId: string): Promise<Group[]> => {
  const { rows } = await pool.query<Group>(
    `
      SELECT ${GROUP_SELECT}
      FROM groups
      WHERE workspace_id = $1
      ORDER BY name ASC
    `,
    [workspaceId],
  );

  return rows;
};

export const updateGroup = async (
  groupId: string,
  workspaceId: string,
  data: UpdateGroupSchema,
): Promise<Group | null> => {
  const { rows } = await pool.query<Group>(
    `
      UPDATE groups
      SET
        name = $1,
        description = $2,
        updated_at = NOW()
      WHERE id = $3
        AND workspace_id = $4
      RETURNING ${GROUP_SELECT}
    `,
    [data.name, data.description ?? null, groupId, workspaceId],
  );

  return rows[0] ?? null;
};

export const deleteGroup = async (
  groupId: string,
  workspaceId: string,
): Promise<boolean> => {
  const { rowCount } = await pool.query(
    `
      DELETE FROM groups
      WHERE id = $1
        AND workspace_id = $2
    `,
    [groupId, workspaceId],
  );

  return (rowCount ?? 0) > 0;
};

export const addGroupMember = async (
  groupId: string,
  userId: string,
): Promise<void> => {
  await pool.query(
    `
      INSERT INTO group_users (group_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (group_id, user_id) DO NOTHING
    `,
    [groupId, userId],
  );
};

export const removeGroupMember = async (
  groupId: string,
  userId: string,
): Promise<boolean> => {
  const { rowCount } = await pool.query(
    `
      DELETE FROM group_users
      WHERE group_id = $1
        AND user_id = $2
    `,
    [groupId, userId],
  );

  return (rowCount ?? 0) > 0;
};

export const findUserInWorkspace = async (
  userId: string,
  workspaceId: string,
): Promise<boolean> => {
  const { rowCount } = await pool.query(
    `
      SELECT 1
      FROM users
      WHERE id = $1
        AND workspace_id = $2
        AND is_active = true
      LIMIT 1
    `,
    [userId, workspaceId],
  );

  return (rowCount ?? 0) > 0;
};

export const listGroupMembers = async (
  groupId: string,
): Promise<GroupMember[]> => {
  const { rows } = await pool.query<GroupMember>(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role
      FROM group_users gu
      JOIN users u
        ON u.id = gu.user_id
      WHERE gu.group_id = $1
      ORDER BY u.name ASC
    `,
    [groupId],
  );

  return rows;
};
