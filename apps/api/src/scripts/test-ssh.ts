import { testConnection } from "../core/ssh/ssh-service.js";

// Dummy Script to test ssh configs
async function main() {
  try {
    await testConnection({
      host: "192.168.81.100",
      port: 22,
      username: "ubuntu",
      authMethod: "private_key",
      privateKey: `-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----`,
      passphrase: null,
      password: null,
    });

    console.log("✅ Connected successfully");
  } catch (err) {
    console.error("❌ Connection failed");
    console.error(err);
  }
}

main();