export interface Server {
  id: string;
  user_id: string;
  host: string;
  port: number;
  username: string;
  auth_method: ["password", "private_key"];
  password?: string;
  private_key?: string;
  passphrase?: string;
  created_at: Date;
  updated_at: Date;
}
