import type { Request, Response } from "express";
import { dashboardService } from "./dashboard-service.js";

export const getDashboardMetrics = async (req: Request, res: Response) => {
  const workspaceId = req.user.workspace_id || req.user.workspaceId;
  const userId = req.user.id || req.user.user_id || req.user.userId;
  const role = req.user.role; 

  if (!workspaceId || !userId) {
    return res.status(403).json({ error: "Missing workspace or user context." });
  }

  try {
    const dashboardData = await dashboardService.getMetrics(workspaceId, userId, role);
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};