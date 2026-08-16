import pool from "src/db/pool.js";
import type { UserRole } from "../auth/local/auth-types.js";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
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
        id,
        name,
        email,
        role,
        is_active AS "isActive",
        created_at AS "createdAt"
      FROM users
      WHERE workspace_id = $1
      ORDER BY name ASC
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
