import { sshSessionManager } from "../../core/ssh/ssh-session-manager.js";
import { dashboardRepository } from "./dashboard-repository.js";


export const dashboardService = {
  async getMetrics(workspaceId: string, userId: string, role: string) {
    const isAdmin = role === "owner" || role === "admin";
    let activeSessionsCount = 0;

    // Read live state from memory
    try {
      const allLiveSessions = sshSessionManager?.getActiveSessions?.() || [];
      activeSessionsCount = isAdmin 
        ? allLiveSessions.length 
        : allLiveSessions.filter((s: any) => s.userId === userId || s.user_id === userId).length;
    } catch (e) {
      console.warn("Could not read live sessions from SshSessionManager.");
    }

    if (isAdmin) {
      const data = await dashboardRepository.getAdminMetrics(workspaceId);

      return {
        metrics: {
          totalServers: Number(data.metrics.total_servers),
          teamMembers: Number(data.metrics.team_members),
          storageBytes: Number(data.metrics.storage_bytes),
          activeSessions: activeSessionsCount, 
        },
        charts: {
          activity: data.activity.map((a: any) => ({
            date: a.date,
            sessions: Number(a.sessions),
            recordings: Number(a.recordings)
          })),
          osDistribution: data.osDistribution.map((os: any) => ({
            name: os.name,
            value: Number(os.value)
          })),
        },
        recentSessions: data.recentSessions
      };
    } else {
      const data = await dashboardRepository.getUserMetrics(workspaceId, userId);

      return {
        metrics: {
          totalServers: Number(data.metrics.total_servers),
          totalSessions: Number(data.metrics.total_sessions),
        },
        charts: {
          activity: data.activity.map((a: any) => ({
            date: a.date,
            sessions: Number(a.sessions),
            recordings: Number(a.recordings)
          })),
          osDistribution: [] 
        },
        recentSessions: data.recentSessions
      };
    }
  }
};