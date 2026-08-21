<div align="center">

<img src="./apps/web/public/android-chrome-512x512.png" alt="Bastion" width="88" />

# Bastion

**Your entire server fleet, behind one browser tab.**

Self-hosted, browser-based SSH access, file transfer, and full session recording — no private key or password ever touches a laptop.

[Website](https://bastion.skpy.in) · [Quick Install](#quick-install) · [Build from Source](#build-from-source) · [Environment Variables](#environment-variables) · [Roadmap](#roadmap)

[![License: MIT](https://img.shields.io/badge/license-MIT-7D82FB.svg)](./LICENSE)
[![Docker](https://img.shields.io/badge/docker-ghcr.io%2Fsk--py%2Fbastion-7D82FB)](https://github.com/users/sk-py/packages/container/package/bastion-web)

</div>

---

## Table of contents

- [The problem](#the-problem)
- [Features](#features)
- [Quick install](#quick-install)
- [Build from source](#build-from-source)
- [Environment variables](#environment-variables)
- [Deployment & network access](#deployment--network-access)
- [Container hardening](#container-hardening)
- [Tech stack](#tech-stack)
- [Local development](#local-development)
- [How Bastion compares](#how-bastion-compares)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## The problem

Server access today is a mess of half-measures. `.pem` files get emailed, Slacked, and copied into a dozen `~/.ssh` folders, and nobody can say for certain who still has access to what. Desktop SFTP clients and one-off `scp` commands scatter file transfers across tools with no record of what moved where. And when something goes wrong at 2 AM, there's no replay — just guesswork about what someone actually typed.

Bastion replaces all of it with one governed entry point. Every connection, every keystroke, every file — routed through a system that knows exactly who did what, and can show you.

## Features

- **A real terminal, in the browser, that doesn't lose its place.** Full-featured, responsive SSH terminal access from any device, phone included, with a purpose-built mobile input layer. Close the tab, lock the phone, drop the WiFi for a second — reopen it and the session is exactly where it was left, still connected to the same shell.
- **Nobody ever sees a credential.** Server passwords and private keys are stored encrypted and never exposed to the people using them. Users get access to servers, not to secrets. Revoke someone's access and it's immediate — any terminal session they had open is severed on the spot, not "eventually," not "next time they reconnect."
- **Every session, recorded and replayable.** Every terminal session is captured automatically in the open [asciicast v2](https://docs.asciinema.org/manual/asciicast/v2/) format and can be replayed later exactly as it happened — file transfers marked directly on the timeline so an audit never has a blind spot. No setup, no opt-in.
- **File transfer without leaving the terminal.** Drag a file onto the terminal and it streams straight through to the remote server — no buffering to disk along the way, no separate FTP client, no context switch. It shows up in the session's audit trail like everything else.
- **Workspaces and roles that actually mean something.** One workspace per deployment, three roles — owners and admins manage servers and users and can review anyone's session history for security review; everyone else sees only what they've been given access to, including their own recordings, not the whole team's.
- **Locked down by default, not by configuration.** Bastion doesn't rely on anyone remembering to add a firewall rule. Out of the box, it's reachable only from the machine it runs on — nothing is exposed to the network until something is deliberately put in front of it. The application itself runs as an unprivileged, capability-stripped process with a read-only filesystem, so even a worst-case compromise has almost nothing to work with.
- **Set up once, force good hygiene from day one.** On first launch, Bastion creates a single owner account automatically. Logging in with it requires setting a real name, email, and password before anything else is possible — no shared default credentials lingering in production.

## Quick install

If you want to run Bastion as-is, using the published images, this is the fastest path — no source code, no build step.

**macOS / Linux:**

```bash
curl -fsSL https://bastion.skpy.in/install.sh | sh
```

**Windows (PowerShell):**

```powershell
irm https://bastion.skpy.in/install.ps1 | iex
```

Both scripts do the same thing, and are safe to re-run:

- Check that Docker, the Docker Compose v2 plugin, and `curl` (or `Invoke-WebRequest` on Windows) are available, failing early with a clear message if something's missing.
- Pull down `docker-compose.yaml` and `.env.example` — nothing else.
- Create `./bastion` if it doesn't already exist, or update the deployment files in place if it does.
- Copy `.env.example` to `.env` **only if `.env` doesn't already exist** — an existing configuration is never overwritten.
- On a fresh `.env`, generate a random `ENCRYPTION_KEY` (32 bytes, hex-encoded) and replace the example database password everywhere it appears, so a real deployment never runs on the documented example credentials.

Either script leaves you with:

```bash
cd bastion
# review .env and fill in anything still blank
docker compose up -d
```

That's it. Bastion connects to its database, brings the schema up to date, creates the owner account, and starts serving. Open `http://127.0.0.1:${WEB_PORT:-18401}`, log in with the bootstrap credentials, set a real password, and start managing servers.

> Prefer to inspect the installer before piping it into a shell? Read [`install.sh`](http://bastion.skpy.in/install.sh) or [`install.ps1`](http://bastion.skpy.in/install.ps1) first — that's exactly what they run, nothing more.

## Build from source

If you want to change anything about the application itself — swap the logo, adjust the theme, modify or extend functionality — clone the full repository instead:

```bash
git clone https://github.com/sk-py/bastion.git
cd bastion
```

From here, run Bastion locally with hot-reloading for active development (see [Local development](#local-development) below), or build your own container images from the included Dockerfiles to deploy your customized version instead of the published ones. The published `docker-compose.yaml` pulls prebuilt images by reference — to run your own build, point it at the images you build yourself rather than the published tags:

```yaml
services:
  web:
    image: ghcr.io/sk-py/bastion-web:latest # replace with your own build
  api:
    image: ghcr.io/sk-py/bastion-api:latest # replace with your own build
```

## Environment variables

```bash
# ============================================================
# Database
# ============================================================

# Set to "postgres" to run PostgreSQL via the bundled container.
# Leave empty to point at an external PostgreSQL instance instead.
COMPOSE_PROFILES=postgres

DATABASE_URL=postgresql://bastion:bastion_password@postgres:5432/bastion

# Only used when COMPOSE_PROFILES=postgres
POSTGRES_DB=bastion
POSTGRES_USER=bastion
POSTGRES_PASSWORD=bastion_password

# ============================================================
# Application
# ============================================================

NODE_ENV=production
WEB_PORT=18401                            # Host port the web UI is exposed on (loopback only by default)

AUTH_SESSION_TTL_MS=21600000              # Login session lifetime in ms (6 hours by default)
ENCRYPTION_KEY=                           # 32 raw bytes, hex-encoded (64 hex characters). Encrypts stored server credentials at rest.
TRUST_PROXY=loopback                      # Express "trust proxy" setting — adjust if fronted by more than one proxy hop

# Email for the automatically created initial owner account.
BASTION_BOOTSTRAP_EMAIL=
```

| Variable | Required | Notes |
|---|---|---|
| `COMPOSE_PROFILES` | No | Set to `postgres` to run the bundled database container; leave empty to bring your own. |
| `DATABASE_URL` | Yes | Standard `postgresql://` connection string. |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Only with the bundled profile | Ignored when pointing at an external Postgres instance. |
| `NODE_ENV` | Yes | `production` for the published images. |
| `WEB_PORT` | No | Defaults to `18401`. Host-side port only — see [Deployment & network access](#deployment--network-access). |
| `AUTH_SESSION_TTL_MS` | No | Login session lifetime in milliseconds. Defaults to 6 hours. |
| `ENCRYPTION_KEY` | Yes | **Must be exactly 64 hex characters** (32 raw bytes). The quick installer generates this for you with `openssl rand -hex 32`; building from source or bringing your own `.env`, generate it the same way. |
| `TRUST_PROXY` | No | Express `trust proxy` setting. Adjust if Bastion sits behind more than one proxy hop. |
| `BASTION_BOOTSTRAP_EMAIL` | No | Email used for the automatically created initial owner account. |

> **Never hand-edit the internal API port.** It's baked into the bundled web image's proxy configuration at build time, not read from `.env` at runtime — changing it without rebuilding that image will break routing between the `web` and `api` containers.

## Deployment & network access

By default, Bastion's web interface is bound to `127.0.0.1` on the host — it is **not** reachable from your network or the internet out of the box. This is deliberate. To reach it from anywhere other than the machine it's running on, put something in front of it that terminates access to people you trust.

The recommended approach is a private overlay network (a personal VPN mesh works well) combined with a reverse proxy that only listens on that private network's address. A minimal example, proxying from a private-network address to Bastion's loopback-bound port with TLS termination:

```nginx
server {
    listen <your-private-network-ip>:443 ssl;
    server_name bastion.internal;

    location / {
        proxy_pass http://127.0.0.1:18401;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        client_max_body_size 1000M;
    }

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
}
```

> **Recommended: [Tailscale](https://tailscale.com/).** It's the easiest way to get the private-network address this example proxies from — install the client, log in, and your machine has a private, WireGuard-encrypted address on your own mesh network, with no port forwarding and no manual key exchange to manage. The Personal plan is free indefinitely for up to 6 users with unlimited devices, which comfortably covers a homelab or a small team.

If you'd rather expose Bastion directly on a local network or the public internet instead, any reverse proxy works — just make sure it forwards `Upgrade` and `Connection` headers (required for the terminal and live session playback, both WebSocket-based) and doesn't buffer request bodies on the upload path.

## Container hardening

The shipped Docker Compose configuration isn't a minimal example — it's the same hardening profile used in production:

- Runs as an unprivileged, non-root user
- Read-only root filesystem — the application cannot modify its own code or install anything at runtime
- All Linux kernel capabilities dropped, privilege escalation explicitly blocked
- Only two writable paths exist at all: session recordings and application logs, each on its own dedicated, isolated volume

## Tech stack

**Frontend** — React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router.

**Backend** — Node.js (v22+), Express, TypeScript, [`ssh2`](https://github.com/mscdex/ssh2) for the underlying SSH2 protocol client, native WebSockets for the live terminal and session streaming, [`busboy`](https://github.com/mscdex/busboy) for streaming multipart file transfers straight through to the remote host without buffering to disk, [`winston`](https://github.com/winstonjs/winston) for structured application logging, and Zod for I/O validation.

**Database** — PostgreSQL 16+, raw `pg` queries and `node-pg-migrate` — no ORM.

**Terminal & recording** — [xterm.js](https://xtermjs.org/) for the in-browser terminal, sessions recorded in the open [asciicast](https://docs.asciinema.org/manual/asciicast/v2/) format and replayed with the [asciinema player](https://github.com/asciinema/asciinema-player).

**Security** — Argon2id password hashing, SHA-256 session token tracking, parameterized SQL throughout.

**Deployment** — Docker Compose, with a hardened, non-root, read-only container configuration. Published images: [`ghcr.io/sk-py/bastion-web`](https://github.com/users/sk-py/packages/container/package/bastion-web) and [`ghcr.io/sk-py/bastion-api`](https://github.com/users/sk-py/packages/container/package/bastion-api).

Built as a modular monorepo (Turborepo + pnpm workspaces).

## Local development

```bash
pnpm install
docker compose up postgres -d
pnpm dev
```

Requires Node.js 22+ and pnpm.

## How Bastion compares

Bastion isn't the only self-hosted gateway solving this problem, but it's built on a fundamentally lighter stack than most of the alternatives — and a couple of these are close calls, not a clean sweep.

| | Bastion | [Bastillion](https://github.com/bastillion-io/Bastillion) | [Apache Guacamole](https://guacamole.apache.org/) | [Warpgate](https://github.com/warp-tech/warpgate) |
|---|---|---|---|---|
| **License** | MIT — free and unrestricted, forever | [Prosperity Public License](https://prosperitylicense.com/) — free for noncommercial use; commercial use gets a 30-day trial, then requires a paid license | Apache 2.0 | Apache 2.0 |
| **Runtime** | Node.js — the whole stack (API, web server, database) idles at ~85 MB combined, measured on a live deployment | JVM on embedded Jetty — a fixed heap-allocation and garbage-collection cost paid before it's done any real work, by design | Split across three separate runtimes: a C proxy (`guacd`), a Java servlet container (Tomcat), and a database | Single compiled Rust binary — typically very memory-lean; we haven't measured it directly, so no head-to-head number here |
| **Setup** | `docker compose up -d`, or a one-line installer script | Requires a matching JDK version and Maven installed locally, with `JAVA_HOME` and `M2_HOME` exported by hand before it will even build | Session recording alone requires manually creating and `chown`-ing a directory shared between the `guacd` and servlet-container users | Ships as a single binary with no external dependencies — genuinely comparable in simplicity to Bastion's own setup |
| **Session audit format** | Open [asciicast v2](https://docs.asciinema.org/manual/asciicast/v2/) — replayable in any compatible player | Recorded within the app; not documented anywhere as an open, portable format | Own protocol-dump format, played back natively in Guacamole's own web UI — no forced video re-encoding | Recorded and replayable through its own admin UI |

## Roadmap

These are ideas for where Bastion goes next — **not yet built**, and open contributions toward any of them are welcome.

- **Session sharing** — share a recorded session via a unique link for debugging, onboarding, or post-mortems.
- **Live session shadowing** — let an admin silently observe an active session in real time.
- **Zero-downtime key rotation** — rotate the encryption key across every stored credential atomically, with automatic rollback if anything fails partway.
- **SSO / OAuth** — Google and GitHub login for faster team onboarding.
- **SSH host fingerprint verification** — cryptographic host verification to guard against man-in-the-middle attacks on first connection.
- **Cloud storage offload** — move session recordings to S3 or Azure Blob Storage instead of local disk.
- **Command snippet library** — store and inject frequently-used scripts directly into the terminal.
- **Zmodem support** — legacy in-terminal file transfer protocol support.

## Contributing

Issues and pull requests are welcome. If you're picking up something from the [roadmap](#roadmap) above, opening an issue first to align on approach is appreciated before sinking real time into it.

## License

MIT — see [`LICENSE`](./LICENSE) for details.
