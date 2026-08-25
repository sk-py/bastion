import pool from "../../db/pool.js";

export const dashboardRepository = {
  async getAdminMetrics(workspaceId: string) {
    const client = await pool.connect();
    try {
      const countsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM servers WHERE workspace_id = $1) as total_servers,
          (SELECT COUNT(*) FROM users WHERE workspace_id = $1) as team_members,
          (
            SELECT COALESCE(SUM(file_size_bytes), 0) 
            FROM terminal_recordings tr 
            JOIN servers s ON tr.server_id = s.id 
            WHERE s.workspace_id = $1
          ) as storage_bytes
      `;

      const osQuery = `
        SELECT COALESCE(operating_system, 'Unknown') as name, COUNT(id) as value
        FROM servers
        WHERE workspace_id = $1
        GROUP BY COALESCE(operating_system, 'Unknown');
      `;

      const activityQuery = `
        SELECT 
          to_char(tr.started_at, 'Mon DD') as date,
          COUNT(tr.id) as sessions,
          COUNT(tr.storage_key) as recordings
        FROM terminal_recordings tr
        JOIN servers s ON tr.server_id = s.id
        WHERE s.workspace_id = $1 AND tr.started_at >= NOW() - INTERVAL '7 days'
        GROUP BY to_char(tr.started_at, 'Mon DD')
        ORDER BY MIN(tr.started_at) ASC;
      `;

      const recentSessionsQuery = `
        SELECT 
          tr.id, tr.session_id as "sessionId", s.name as "serverName", 
          u.name as "userName", tr.duration_seconds as "durationSeconds", 
          tr.status, tr.started_at as "startedAt"
        FROM terminal_recordings tr
        JOIN servers s ON tr.server_id = s.id
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE s.workspace_id = $1
        ORDER BY tr.started_at DESC
        LIMIT 5;
      `;

      const [counts, osDistribution, activity, recentSessions] = await Promise.all([
        client.query(countsQuery, [workspaceId]),
        client.query(osQuery, [workspaceId]),
        client.query(activityQuery, [workspaceId]),
        client.query(recentSessionsQuery, [workspaceId])
      ]);

      return {
        metrics: counts.rows[0],
        osDistribution: osDistribution.rows,
        activity: activity.rows,
        recentSessions: recentSessions.rows
      };
    } finally {
      client.release();
    }
  },

  async getUserMetrics(workspaceId: string, userId: string) {
    const client = await pool.connect();
    try {
     const countsQuery = `
        WITH user_servers AS (
          SELECT id FROM servers WHERE workspace_id = $1 AND user_id = $2
          UNION
          SELECT gs.server_id 
          FROM group_servers gs 
          JOIN group_users gu ON gs.group_id = gu.group_id 
          WHERE gu.user_id = $2
        )
        SELECT 
          (SELECT COUNT(*) FROM user_servers) as total_servers,
          (SELECT COUNT(*) FROM terminal_recordings WHERE user_id = $2) as total_sessions;
      `;

      // FIXED: user_id is now $1 (it receives [userId])
      const activityQuery = `
        SELECT 
          to_char(started_at, 'Mon DD') as date,
          COUNT(id) as sessions,
          COUNT(storage_key) as recordings
        FROM terminal_recordings
        WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '7 days'
        GROUP BY to_char(started_at, 'Mon DD')
        ORDER BY MIN(started_at) ASC;
      `;

      // FIXED: tr.user_id is now $1 (it receives [userId])
      const recentSessionsQuery = `
        SELECT 
          tr.id, tr.session_id as "sessionId", s.name as "serverName", 
          u.name as "userName", tr.duration_seconds as "durationSeconds", 
          tr.status, tr.started_at as "startedAt"
        FROM terminal_recordings tr
        JOIN servers s ON tr.server_id = s.id
        JOIN users u ON tr.user_id = u.id
        WHERE tr.user_id = $1
        ORDER BY tr.started_at DESC
        LIMIT 5;
      `;

      const [counts, activity, recentSessions] = await Promise.all([
        client.query(countsQuery, [workspaceId, userId]),
        client.query(activityQuery, [userId]),
        client.query(recentSessionsQuery, [userId])
      ]);

      return {
        metrics: counts.rows[0],
        activity: activity.rows,
        recentSessions: recentSessions.rows
      };
    } finally {
      client.release();
    }
  }
};