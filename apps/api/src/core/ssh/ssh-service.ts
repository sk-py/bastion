import {
  SSHAuthenticationError,
  SSHConnectionError,
  SSHTimeoutError,
} from "./ssh-errors.js";
import type { SSHConfig } from "./ssh-types.js";
import { Client, type ConnectConfig } from "ssh2";

const CONNECTION_TIMEOUT = 10_000;

export const testConnection = async (config: SSHConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = new Client();

    let settled = false;

    const cleanup = () => {
      client.removeAllListeners();
      client.end();
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const success = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const connectionConfig: ConnectConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: CONNECTION_TIMEOUT,
    };

    if (config.authMethod === "password") {
      connectionConfig.password = config.password!;
    } else {
      connectionConfig.privateKey = config.privateKey!;
      connectionConfig.passphrase = config.passphrase ?? "";
    }

    client.once("ready", success);

    client.once("error", (err) => {
      switch (err.level) {
        case "client-authentication":
          fail(new SSHAuthenticationError(err.message));
          break;
        case "client-timeout":
          fail(new SSHTimeoutError(err.message));
          break;
        default:
          fail(new SSHConnectionError(err.message));
      }
    });
    client.connect(connectionConfig);
  });
};
