import WebSocket from "ws";
import { fetchServerById } from "../servers/server-repository.js";
import type { ClientChannel } from "ssh2";
import NotFoundError from "src/core/errors/not-found.js";
import { decrypt } from "src/core/utils/encryption.js";
import { connect } from "src/core/ssh/ssh-service.js";
import type { TerminalSession } from "./terminal-types.js";


export const createTerminalSession = async (
  userId: string,
  serverId: string,
  //   ws: WebSocket,
): Promise<TerminalSession> => {
  const server = await fetchServerById(serverId, userId);

  if (!server) {
    throw new NotFoundError("Server not foumd.");
  }

  const password = server.encryptedPassword
    ? decrypt(server.encryptedPassword)
    : null;

  const privateKey = server.encryptedPrivateKey
    ? decrypt(server.encryptedPrivateKey)
    : null;

  const passphrase = server.encryptedPassphrase
    ? decrypt(server.encryptedPassphrase)
    : null;

  const client = await connect({
    host: server.host,
    port: server.port,
    username: server.username,
    authMethod: server.authMethod,
    password,
    privateKey,
    passphrase,
  });

  const stream = await new Promise<ClientChannel>((resolve, reject) => {
    client.shell((error, channel) => {
      if (error) {
        client.end();
        reject(error);
        return;
      }
      resolve(channel);
    });
  });

  return { stream, client };
};
