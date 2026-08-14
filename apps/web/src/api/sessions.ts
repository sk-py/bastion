import { api } from "./axios";

export type SessionStatus = "recording" | "uploading" | "completed" | "failed";
export type SessionProvider = "local" | "s3" | "azure";

export interface Session {
  id: string;
  sessionId: string;
  serverId: string;
  serverName: string;
  serverUsername: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: SessionStatus;
  provider: SessionProvider;
  storageKey: string | null;
  fileSizeBytes: string | null;
  durationSeconds: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface SessionsListResponse {
  status: string;
  data: Session[];
}

export const getSessions = async (serverId?: string): Promise<Session[]> => {
  const { data } = await api.get<SessionsListResponse>("/sessions", {
    params: serverId ? { serverId } : undefined,
  });
  return data.data;
};

export const getSessionStreamUrl = (id: string): string => `/api/v1/sessions/${id}/stream`;