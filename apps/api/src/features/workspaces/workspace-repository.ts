import pool from "../../db/pool.js";
import type { UserRole } from "../auth/local/auth-types.js";

export interface WorkspaceUserGroup {
  id: string;
  name: string;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

export const listWorkspaceUsers = async (
  workspaceId: string,
): Promise<WorkspaceUser[]> => {
  const { rows } = await pool.query<WorkspaceUser>(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active AS "isActive",
        u.created_at AS "createdAt",
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', g.id,
              'name', g.name
            )
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) AS groups
      FROM users u
      LEFT JOIN group_users gu
        ON gu.user_id = u.id
      LEFT JOIN groups g
        ON g.id = gu.group_id
      WHERE u.workspace_id = $1
      GROUP BY
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at
      ORDER BY u.name ASC
    `,
    [workspaceId],
  );

  return rows;
};

export const listWorkspaceServers = async (
  workspaceId: string,
): Promise<WorkspaceServer[]> => {
  const { rows } = await pool.query<WorkspaceServer>(
    `
      SELECT
        id,
        name,
        host,
        port,
        operating_system AS "operatingSystem",
        architecture,
        CASE
          WHEN last_connected_at IS NOT NULL
            AND last_connected_at > NOW() - INTERVAL '5 minutes'
          THEN 'online'
          ELSE 'offline'
        END AS status
      FROM servers
      WHERE workspace_id = $1
      ORDER BY name ASC
    `,
    [workspaceId],
  );

  return rows;
};
