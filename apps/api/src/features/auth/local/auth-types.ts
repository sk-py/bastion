export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}
export interface LoginUserInput {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}

export interface Session {
  id: string;
  user_id: string;
  session_token_hash: string;
  expires_at: Date;
  last_used_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateSessionInput {
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}
