import {
  SSHAuthenticationError,
  SSHConnectionError,
  SSHTimeoutError,
} from "./ssh-errors.js";
import type { DiscoveredServerMetadata, SSHConfig } from "./ssh-types.js";
import { Client, type ConnectConfig } from "ssh2";

const CONNECTION_TIMEOUT = 10_000;

export const testConnection = async (config: SSHConfig): Promise<void> => {
  const client = await connect(config);
  client.end();
};

export const discoverServer = async (
  config: SSHConfig,
): Promise<DiscoveredServerMetadata> => {
  const client = await connect(config);

  try {
    const hostname = await runCommand(client, "hostname");
    const osRelease = await runCommand(client, "cat /etc/os-release");

    const operatingSystem =
      osRelease
        ?.split("\n")
        .find((line) => line.startsWith("PRETTY_NAME="))
        ?.split("=")[1]
        ?.replace(/^"|"$/g, "") ?? null;

    const architecture = await runCommand(client, "uname -m");

    const kernelVersion = await runCommand(client, "uname -r");

    const cpuCoreCount = Number(await runCommand(client, "nproc"));

    const memoryTotalBytes = Number(
      await runCommand(
        client,
        "awk '/MemTotal/ {print $2 * 1024}' /proc/meminfo",
      ),
    );

    const diskTotalBytes = Number(
      await runCommand(client, "df -B1 / | awk 'NR==2 {print $2}'"),
    );

    const sshVersion = await runCommand(client, "sshd -V 2>&1 || ssh -V 2>&1");

    return {
      hostname,
      operatingSystem,
      architecture,
      kernelVersion,
      sshVersion,
      cpuCoreCount,
      memoryTotalBytes,
      diskTotalBytes,
      hostFingerprint: null,
      lastConnectedAt: new Date(),
      discoveredAt: new Date(),
    };
  } finally {
    client.end();
  }
};

const runCommand = async (client: Client, command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = "";
      let stderr = "";

      stream.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      stream.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      stream.once("close", (code: number) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(
            new Error(
              stderr.trim() ||
                `Command "${command}" failed with exit code ${code}`,
            ),
          );
        }
      });
    });
  });
};

export const connect = async (config: SSHConfig): Promise<Client> => {
  return new Promise((resolve, reject) => {
    const client = new Client();

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

    client.once("ready", () => resolve(client));

    client.once("error", (err) => {
      switch (err.level) {
        case "client-authentication":
          reject(new SSHAuthenticationError(err.message));
          break;
        case "client-timeout":
          reject(new SSHTimeoutError(err.message));
          break;
        default:
          reject(new SSHConnectionError(err.message));
      }
    });

    client.connect(connectionConfig);
  });
};
