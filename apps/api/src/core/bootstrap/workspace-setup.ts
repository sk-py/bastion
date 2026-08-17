import argon2 from "argon2";
import { env } from "../../config.js";
import pool from "../../db/pool.js";

const BOOTSTRAP_WORKSPACE_NAME = "Workspace 1";

const BOOTSTRAP_EMAIL = env.BASTION_BOOTSTRAP_EMAIL || "master@bastion.local";
const BOOTSTRAP_PASSWORD = "admin@123";

export const initializeWorkspace = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: workspaceRows } = await client.query<{
      id: string;
    }>(
      `
        SELECT id
        FROM workspaces
        LIMIT 1
      `,
    );

    // Bastion has already been initialized.
    if (workspaceRows.length > 0) {
      await client.query("COMMIT");
      return;
    }

    const passwordHash = await argon2.hash(BOOTSTRAP_PASSWORD, {
      type: argon2.argon2id,
    });

    const { rows: createdWorkspace } = await client.query<{
      id: string;
    }>(
      `
        INSERT INTO workspaces (name)
        VALUES ($1)
        RETURNING id
      `,
      [BOOTSTRAP_WORKSPACE_NAME],
    );

    const workspaceId = createdWorkspace[0]!.id;

    await client.query(
      `
        INSERT INTO users (
          workspace_id,
          name,
          email,
          password_hash,
          role,
          must_change_password,
          is_active
        )
        VALUES ($1, $2, $3, $4, 'owner', true, true)
      `,
      [
        workspaceId,
        "Master",
        BOOTSTRAP_EMAIL,
        passwordHash,
      ],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};