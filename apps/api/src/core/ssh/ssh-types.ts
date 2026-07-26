export type SSHAuthMethod = "password" | "private_key";

export interface SSHConfig {
  host: string;
  port: number;
  username: string;

  authMethod: SSHAuthMethod;

  password: string | null;
  privateKey: string | null;
  passphrase: string | null;
}