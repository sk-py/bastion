# Bastion

**Your entire server fleet, behind one browser tab.**

Bastion is an open-source, self-hosted infrastructure gateway that gives your whole team secure, browser-based SSH access, file transfer, and full session recording — without a single private key or password ever touching their laptop.

## The Problem

Server access today is a mess of half-measures. `.pem` files get emailed, Slacked, and copied into six different `~/.ssh` folders, and nobody can say for certain who still has access to what. Desktop SFTP clients and one-off `scp` commands scatter file transfers across tools with no record of what moved where. And when something goes wrong at 2 AM, there's no replay — just guesswork about what someone actually typed.

Bastion replaces all of it with one governed entry point. Every connection, every keystroke, every file — routed through a system that knows exactly who did what, and can show you.

## Features

**A real terminal, in your browser, that doesn't lose your place.**
Full-featured, responsive SSH terminal access from any device — phone included, with a purpose-built mobile input layer, not a cramped afterthought. Close the tab, lock your phone, lose your WiFi for a second — reopen it and your session is exactly where you left it, still connected to the same shell.

**Nobody ever sees a credential.**
Server passwords and private keys are stored encrypted and never exposed to the people using them. Users get access to *servers*, not to secrets. Revoke someone's access and it's immediate — any terminal session they had open is severed on the spot, not "eventually," not "next time they reconnect."

**Every session, recorded and replayable.**
Every terminal session is automatically captured in a compact, efficient format and can be replayed later exactly as it happened — full-fidelity, frame-by-frame, including file transfers marked directly on the timeline so an audit never has a blind spot. No setup, no opt-in. It just happens.

**File transfer without leaving the terminal.**
Drag a file onto the terminal and it streams straight through to the remote server — no buffering to disk along the way, no separate FTP client, no context switch. Fast, direct, and it shows up in the session's audit trail like everything else.

**Workspaces and roles that actually mean something.**
One workspace per deployment, three roles — owners and admins manage servers and users and can review anyone's session history for security review; everyone else sees only what they've been given access to, including their *own* recordings, not the whole team's.

**Locked down by default, not by configuration.**
Bastion doesn't rely on you remembering to add a firewall rule. Out of the box, it's reachable only from the machine it runs on — nothing is exposed to the network until you deliberately put something in front of it (a private network overlay is the recommended path; see below). The application itself runs as an unprivileged, capability-stripped process with a read-only filesystem, so even a worst-case compromise has almost nothing to work with.

**Set up once, force good hygiene from day one.**
On first launch, Bastion creates a single owner account for you automatically. Log in with it, and you're required to set a real name, email, and password before you can do anything else — no shared default credentials lingering in production.

## Get Started in Minutes

There are two ways to run Bastion, depending on what you're trying to do.

### Quick Install — just run it

If you want to run Bastion as-is, using the published images, this is the fastest path — no source code, no build step.

**macOS / Linux:**
```bash
curl -fsSL https://bastion.domain.in/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://bastion.domain.in/install.ps1 | iex
```

Both do the same thing: pull down the deployment files you need (nothing else), generate secure random values for you where it safely can, and get out of your way. Either way, you'll be left with:

```bash
cd bastion
# edit .env — fill in anything still blank
docker compose up -d
```

That's it. Bastion connects to its database, brings the schema up to date, creates your owner account, and starts serving. Open the URL, log in with the bootstrap credentials, set your real password, and you're managing servers.

### Build from Source — customize it

If you want to change anything about the application itself — swap the logo, adjust the theme, modify or extend functionality — clone the full repository instead:

```bash
git clone https://github.com/your-org/bastion.git
cd bastion
```

From here you can run Bastion locally with hot-reloading for active development (see [Local Development](#local-development) below), or build your own container images from the included Dockerfiles to deploy your customized version instead of the published ones. The published `docker-compose.yaml` pulls prebuilt images by reference — to run your own build, point it at the images you build yourself rather than the published tags.

## Deployment & Network Access

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

If you'd rather expose Bastion directly on a local network or the public internet instead, any reverse proxy works — just make sure it forwards `Upgrade` and `Connection` headers (required for the terminal and live session playback, both WebSocket-based) and doesn't buffer request bodies on the upload path.

### Container hardening

The shipped Docker Compose configuration isn't a minimal example — it's the same hardening profile used in production:

- Runs as an unprivileged, non-root user
- Read-only root filesystem — the application cannot modify its own code or install anything at runtime
- All Linux kernel capabilities dropped, privilege escalation explicitly blocked
- Only two writable paths exist at all: session recordings and application logs, each on its own dedicated, isolated volume

## Environment Variables

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
ENCRYPTION_KEY=                           # Encrypts stored server credentials at rest
TRUST_PROXY=loopback                      # Express "trust proxy" setting — adjust if fronted by more than one proxy hop

# Email for the automatically created initial owner account.
BASTION_BOOTSTRAP_EMAIL=

# TODO: confirm the remaining bootstrap variables (name / initial password)
# once workspace-setup.ts is available — not documenting a value here that
# hasn't been verified against the actual bootstrap code.
```

> **Note:** Don't hand-edit the internal API port — it's baked into the bundled web image's proxy configuration at build time, not read from `.env` at runtime. Changing it without rebuilding that image will break routing between the two containers.

## Roadmap

These are ideas for where Bastion goes next — not yet built, and open contributions toward any of them are welcome:

- **Session Sharing** — share a recorded session via a unique link for debugging, onboarding, or post-mortems.
- **Live Session Shadowing** — let an admin silently observe an active session in real time.
- **Zero-Downtime Key Rotation** — rotate the encryption key across every stored credential atomically, with automatic rollback if anything fails partway.
- **SSO / OAuth** — Google and GitHub login for faster team onboarding.
- **SSH Host Fingerprint Verification** — cryptographic host verification to guard against man-in-the-middle attacks on first connection.
- **Cloud Storage Offload** — move session recordings to S3 or Azure Blob Storage instead of local disk.
- **Command Snippet Library** — store and inject frequently-used scripts directly into the terminal.
- **Zmodem Support** — legacy in-terminal file transfer protocol support.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router.
- **Backend:** Node.js (v22+), Express, TypeScript, Zod for I/O validation.
- **Database:** PostgreSQL 16+, raw `pg` queries and `node-pg-migrate` — no ORM.
- **Terminal & Recording:** xterm.js for the in-browser terminal, sessions recorded in the open asciicast format and replayed with the asciinema player.
- **Security:** Argon2id password hashing, SHA-256 session token tracking, parameterized SQL throughout.
- **Deployment:** Docker Compose, with a hardened, non-root, read-only container configuration.

Built as a modular monorepo (Turborepo + pnpm workspaces).

## Local Development

```bash
pnpm install
docker compose up postgres -d
pnpm dev
```

Requires Node.js 22+ and pnpm.

## Links & Documentation

- Official Documentation (Coming Soon)
- API Reference (Coming Soon)
- Contributing Guidelines (Coming Soon)
- Issue Tracker (Coming Soon)

## License

MIT — see the `LICENSE` file for details.
