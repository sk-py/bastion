export class SSHAuthenticationError extends Error {
  constructor(message = "Authentication failed.") {
    super(message);
    this.name = "SSHAuthenticationError";
  }
}

export class SSHConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSHConnectionError";
  }
}

export class SSHTimeoutError extends Error {
  constructor(message = "Connection timed out.") {
    super(message);
    this.name = "SSHTimeoutError";
  }
}
