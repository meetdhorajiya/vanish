<div align="center">

# ⚡ VANISH
### Zero-Knowledge Ephemeral Cloud File Sharing Protocol

**Files that share themselves and genuinely clean up after themselves.**  
*Inverting the infinite-retention paradigm of conventional cloud storage.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Web Crypto API](https://img.shields.io/badge/Security-AES--256--GCM-2563eb?style=for-the-badge&logo=shield)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Institution](https://img.shields.io/badge/IIIT_Vadodara-CSE_Design_Project-1d4ed8?style=for-the-badge)](https://iiitvadodara.ac.in/)

</div>

---

## 🏛️ Academic & Engineering Project Credentials

Developed as a core **Design Project** (Autumn 2026–27) for the **Department of Computer Science & Engineering** at the **Indian Institute of Information Technology Vadodara (IIITV)**.

| Role | Name | Identifier / Details |
| :--- | :--- | :--- |
| **Faculty Supervisor** | **Dr. Rishabh Gupta** | Assistant Professor, Dept. of CSE, IIIT Vadodara |
| **Lead Student Engineer** | **Meet Dhorajiya** | Student ID: `202451053` • IIIT Vadodara |
| **Student Engineer** | **Dhairya Desai** | Student ID: `202451051` • IIIT Vadodara |
| **Student Engineer** | **Jatan Bhatt** | Student ID: `202451032` • IIIT Vadodara |

---

## 💡 1. The Core Philosophy: *Inverting Permanence*

Mainstream cloud providers (Google Drive, AWS S3, Dropbox, OneDrive) are engineered around **infinite retention**. Shared access links remain perpetually accessible until a human remembers to manually revoke them. In enterprise, educational, and defense environments, this creates compounding security liabilities:
- **Digital Residue**: Forgotten links containing passwords, student exam papers, financial audits, or medical drafts linger in cloud buckets indefinitely.
- **Access Drift**: Third-party vendors or former employees retain access to long-forgotten files.
- **Storage Bloat**: Hundreds of gigabytes of stale intermediate binaries generate unnecessary cloud costs.

### The Vanish Paradigm
**VANISH** treats ephemerality as a fundamental, non-negotiable primitive:
1. **Automated Cryptographic Time-to-Live (TTL)**: Expiration countdowns are enforced at both the client tier and database persistence layer.
2. **True Physical Cloud Scrubbing**: When $T=0$ or a download quota is satisfied, binary payloads are physically unlinked and shredded from disk storage (`./data/uploads`) and metadata is expunged from database records.
3. **Zero Digital Residue**: Expired links return immediate cryptographic `410 Gone` tombstones. Recovery is mathematically and physically impossible.

---

## 🏗️ 2. High-Level System Architecture

```mermaid
graph TD
    subgraph Client Tier [Browser / Client Hardware]
        A[User selects file] --> B[Web Crypto API: AES-256-GCM]
        B --> C[Compute SHA-256 Checksum]
        C --> D[Multipart Stream with TTL & Quota]
    end

    subgraph Transport & Edge Tier [Next.js Edge Proxy]
        D --> E[src/proxy.ts: Route & JWT Attestation]
        E --> F[API Gateway /api/upload]
    end

    subgraph Persistence & Application Tier [Node.js Engine]
        F --> G[Write Binary: ./data/uploads/]
        F --> H[Update Ledger: ./data/db.json]
    end

    subgraph Janitor Daemon [Background TTL Sweeper]
        I[src/server/cleanup.ts: 5000ms Interval] -->|Poll Expiration| H
        I -->|Physical fs.unlinkSync| G
        I -->|Status: Expired| H
    end

    subgraph Recipient Portal [/f/:id]
        J[Recipient accesses link] --> K{Password Protected?}
        K -->|Yes| L[POST /api/file/:id/unlock -> HMAC-SHA256 Token]
        K -->|No| M[GET /api/file/:id/download]
        L --> M
        M --> N[Atomic Quota Decrement]
        N -->|Quota Exhausted or TTL = 0| I
    end
```

---

## 🔐 3. Applied Cryptographic Implementation

| Layer | Protocol / Algorithm | Specification & Implementation |
| :--- | :--- | :--- |
| **Client Encryption** | `AES-256-GCM` | Client Web Crypto API (`SubtleCrypto`). 256-bit symmetric key derived via PBKDF2 (100,000 rounds SHA-256). |
| **Payload Integrity** | `SHA-256` | Byte-level message digest calculated client-side before upload to detect in-transit corruption or tampering. |
| **Password Auth** | `PBKDF2-SHA512` | Salted key derivation with 10,000 iterations and 64-byte output for access control passphrases. |
| **Token Attestation** | `HMAC-SHA256 JWT` | Stateless short-lived JWT download tokens and 7-day session cookies signed with server secret (`node:crypto`). |
| **Transport** | `TLS 1.3 / HSTS` | Strict transport security protecting against packet inspection and MITM vector interception. |

---

## 📁 4. Project Structure

```
vanish/
├── src/
│   ├── app/                                # Next.js App Router
│   │   ├── page.tsx                        # Auth Portal & Landing
│   │   ├── layout.tsx                      # Root layout with Header & Providers
│   │   ├── dashboard/page.tsx              # Command Center, Audit Ledger & Live Timers
│   │   ├── upload/page.tsx                 # Upload Studio (AES-256, SHA-256, QR Code)
│   │   ├── f/[id]/page.tsx                 # Recipient Download, Decrypt & Burn Engine
│   │   ├── auth/page.tsx                   # JWT Identity & API Secret Token Inspector
│   │   ├── architecture/page.tsx           # Full Technical Spec & Architecture Diagram
│   │   └── api/
│   │       ├── auth/route.ts               # POST login/signup/logout, GET verify
│   │       ├── upload/route.ts             # POST multipart file upload
│   │       ├── files/route.ts              # GET list all files (auth-protected)
│   │       ├── file/[id]/
│   │       │   ├── route.ts                # GET metadata, DELETE instant revoke
│   │       │   ├── unlock/route.ts         # POST password verification -> token
│   │       │   └── download/route.ts       # GET stream binary (quota-aware)
│   │       └── reset/route.ts              # POST restore demo seed files
│   ├── components/                         # Modular High-Performance UI Components
│   │   ├── CountdownClock.tsx              # Real-Time Millisecond TTL Ticker
│   │   ├── Header.tsx                      # Aerodynamic Brand Lockup, Auth & Health Pill
│   │   ├── InteractiveArchitectureDiagram.tsx # Interactive Node-by-Node Pipeline Visualizer
│   │   ├── QRCodeModal.tsx                 # QR Code Generator for Instant Mobile Transfer
│   │   ├── Toast.tsx                       # Glassmorphic Non-Blocking Notification System
│   │   └── ZeroPageCatalog.tsx             # Interactive Scenario Sandbox & Hero Hub
│   ├── server/                             # Server-Side Persistence & Daemon
│   │   ├── db.ts                           # JSON database + disk file storage
│   │   ├── crypto.ts                       # ID gen, PBKDF2, HMAC-SHA256 JWT
│   │   └── cleanup.ts                      # Background daemon (5s TTL sweeper)
│   ├── services/                           # Client-Side Storage & Hardware APIs
│   │   ├── crypto.ts                       # Web Crypto API (AES-256-GCM, PBKDF2, SHA-256)
│   │   ├── sound.ts                        # Web Audio API Synthesizer (Mechanical Micro-FX)
│   │   └── storage.ts                      # Unified API client & local cache fallback
│   ├── styles/
│   │   └── globals.css                     # Curated Design System, Glassmorphism & Tokens
│   ├── types/
│   │   └── index.ts                        # Strict TypeScript Data Contracts & Interfaces
│   └── proxy.ts                            # Next.js Edge proxy (auth guard + redirects)
├── data/
│   ├── db.json                             # Persistent JSON database (auto-created)
│   └── uploads/                            # Physical binary file storage (auto-created)
├── docs/                                   # Project documentation for developers & AI agents
│   ├── OVERVIEW.md                         # High-level project overview
│   ├── API.md                              # Complete REST API reference
│   ├── AUTH.md                             # Authentication & JWT flow
│   ├── ARCHITECTURE.md                     # System architecture & data flow
│   └── CONTRIBUTING.md                     # Development guide
├── .env                                    # Environment configuration (gitignored)
├── .env.example                            # Environment template (committed)
└── next.config.ts                          # Next.js configuration
```

---

## 🚀 5. Quick Start & Local Development

### Prerequisites
- **Node.js**: `v18.x` or later (`Node 20+` recommended)
- **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/meetdhorajiya/vanish.git

# Navigate into the project directory
cd vanish

# Install dependencies
npm install

# Copy the environment template
cp .env.example .env
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app starts at the **login / dashboard portal**.

> Note: On Windows with this Next.js version, `--webpack` is configured automatically in `package.json`.

---

## ⚙️ 6. Environment Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public base URL |
| `JWT_SECRET` | _(required)_ | HMAC-SHA256 signing secret |
| `JWT_EXPIRES_IN` | `604800` | Token TTL in seconds (7 days) |
| `STORAGE_DIR` | `./data/uploads` | Physical file storage path |
| `DB_PATH` | `./data/db.json` | Database JSON file path |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload size in MB |
| `CLEANUP_INTERVAL_MS` | `5000` | Background cleanup sweep interval |

---

## 📡 7. REST API Routes Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth` | No | Login, signup, or logout |
| `GET` | `/api/auth` | Bearer | Verify JWT token |
| `POST` | `/api/upload` | Cookie/Bearer | Upload a file with TTL options |
| `GET` | `/api/files` | Cookie/Bearer | List all files for current user |
| `GET` | `/api/file/:id` | No | Get file metadata & TTL status |
| `DELETE` | `/api/file/:id` | No | Instant revoke ("Vanish Now") |
| `POST` | `/api/file/:id/unlock` | No | Password verification -> JWT download token |
| `GET` | `/api/file/:id/download` | Token | Stream binary download |
| `POST` | `/api/reset` | No | Restore demo seed data |

See [`docs/API.md`](docs/API.md) for full request/response schemas.

---

## 🔊 8. Tactile Procedural Audio Synthesizer

Rather than burdening the network with static audio asset files, Vanish incorporates a **Web Audio API procedural sound engine** ([sound.ts](file:///src/services/sound.ts)) generating real-time tactile micro-feedback directly on client hardware:
- **Mechanical Soft Click**: Sine wave oscillator sweeping from 800Hz to 300Hz over 40ms.
- **Harmonic Success Chime**: Multi-voice arpeggio ($C_5, E_5, G_5, C_6$) with exponential decay.
- **Incinerator Burn Sound**: White-noise buffer with exponential decay modeling physical disintegration when a file is manually destroyed.
- *Fully accessible: respects hardware mute state with instantaneous toggle in the navbar.*

---

## 🧪 9. Demo Test Records

On first run (or after `POST /api/reset`), the following demo records are seeded:

| ID | Status | Notes |
|---|---|---|
| `demo-active` | Active | 6-hour TTL, 10 download limit |
| `demo-locked` | Active | Password-protected (use `vanish123`) |
| `demo-vanished` | Expired | Demonstrates the expired state UI |
| `demo-exhausted` | Exhausted | Demonstrates the download quota reached UI |
| `demo-fast` | Active | 30-second TTL demonstration file |

Visit `/f/<id>` to test each state directly.

---

## 📜 10. Academic Project Rights & License

This project is submitted in fulfillment of the requirements for the **Design Project** course at the **Indian Institute of Information Technology Vadodara (IIIT Vadodara)**.

Distributed under the **MIT License**. See `LICENSE` for details.

© 2026–2027 Meet Dhorajiya, Dhairya Desai, Jatan Bhatt. Supervised by Dr. Rishabh Gupta, IIIT Vadodara.
