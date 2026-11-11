# SynapEditor — Server Feature Demos

A developer example for SynapEditor's **server-dependent** features —
**import · export · image upload · collaboration**. Each feature has its own demo
page under [`../template/html/server-features/`](../template/html/server-features) and its own server
route, so you can study and configure them one at a time. The editor SDK is loaded from the CDN.

## Quick start (all features)

```bash
# 1) Start the backends — first run pulls the base images from GHCR
#    (public; no docker login needed) and builds the patched collabo/converter images
docker compose up -d

# 2) Start the demo server
npm install && npm start            # → http://localhost:3080
```

Open **http://localhost:3080** (not `file://`) and choose **Server Features**.

## Run one feature at a time

The demo server (`npm start`) is always needed; start only the backend you want:

| Feature | Backend to start | Editor config (shown on the page) |
|---|---|---|
| **Image upload** | *(none — the demo server handles it)* | `editor.upload.image.api` → `/uploadFile` |
| **Export** | `docker compose up -d export-api` | `editor.export.api` → `/exportFile` |
| **Import** | `docker compose up -d converter-api` | `editor.import.api` → `/importDoc` |
| **Collaboration** | `docker compose up -d collabo-ws` | `collaboration.config.wsUrl` → `/collabo_ws` |

Each page's **Configuration** block shows the full, copy-ready config.

## How it works

The browser talks only to the demo server (`:3080`, same origin); the server serves
the site and proxies each feature to its backend:

```
/uploadFile  → saved locally
/importDoc   → converter-api   (:18080 → container 8080)
/exportFile  → export-api      (:9090)
/collabo_ws  → collabo-ws      (:1234)
```

## Layout

```
server/
├── docker-compose.yml     # all: `docker compose up`,  one: `docker compose up <service>`
├── app/                   # demo server (Express): app.js · config.js · helpers.js · routes/
└── docker/                # collabo / converter Dockerfiles (+ *-server.js patches)
                           # base images pulled from ghcr.io/synapeditor/* — not committed
```

## Notes

- **License** — uses `template/license.config.js` (served at `/license.config.js`), same as the static demos.
- **Editor config** — the global editor defaults in `template/synapeditor.config.js` are served at `/synapeditor.config.js`, same as the static demos.
- **Ports** — defaults: collabo `1234`, export `9090`, converter `8080`. If `8080` is busy, put
  `CONVERTER_PORT=18080` and `CONVERTER_SERVER=http://127.0.0.1:18080` in `.env` (see `.env.example`).
  Point the demo server at backends by `127.0.0.1`, not `localhost`: on Node 20+ `localhost`
  intermittently fails with 504 under concurrent requests. (The browser still opens `http://localhost:3080`.)
- **Import size limit** — converter-api accepts any size by default. On a public server, cap it
  with `MAX_FILE_SIZE` (bytes) for `converter-api` in `docker-compose.override.yml`; uploads
  over it get `413`. Keep it at or above the editor's `editor.import.maxSize` (default 10MB).
- **Backend images** — all three run on Node 24 and are pulled from `ghcr.io/synapeditor/*` (public),
  pinned to a version tag so a cached `:latest` never goes stale. `docker compose up` builds the
  patched `collabo-ws-patched` / `converter-api-patched` images locally; `export-api` runs as published.

  | Image | Tag | Built from |
  |---|---|---|
  | `collabo-ws` | `1.0.23` | `synapeditorcollabo` repo (its GitLab registry image, copied as-is) |
  | `converter-api` | `1.0.1` | `editor-global-sdk` `feature/module-builder`, `build/converter` |
  | `export-api` | `0.0.10` | `export_api` repo (its own Dockerfile) |

  When a base image moves to a new tag, update the tag here and in `docker/*.Dockerfile`.
- **Collabo path** - `/collabo_ws` passes the WebSocket upgrade through and answers
  `426 UPGRADE_REQUIRED` to anything else, so the collaboration backend's own HTTP surface
  stays off the demo's port.
- **Error responses** - every failure answers `{ "code", "error" }` with a fixed code
  (`INVALID_UPLOAD`, `FILE_REQUIRED`, `UNSUPPORTED_FILE_TYPE`, `IMPORT_FAILED`, `INVALID_REQUEST`,
  `AI_NOT_CONFIGURED`, `UPSTREAM_FAILED`, `NOT_FOUND`, `INTERNAL_ERROR`) and nothing else;
  the real error, stack trace included, is printed to the server log only. Every route is
  reachable without authentication, so the body must not describe the server.
- **Upload types** - `/uploadFile` stores only the extensions a document can carry (images, video,
  audio, office/PDF/text, archives) and answers `400 UNSUPPORTED_FILE_TYPE` for the rest, because
  everything it stores is served straight back from the demo's own origin under `/tmp`. Replace the
  list with `UPLOAD_ALLOWED_EXT` in `.env` (comma separated, e.g. `UPLOAD_ALLOWED_EXT=.png,.pdf,.zip`).
  Files under `/tmp` are served with `Content-Security-Policy: sandbox` and `X-Content-Type-Options:
  nosniff`, and anything but an image, video, audio, PDF or text file is sent as a download.
- **AI proxy input** - `/requestGPT`, `/requestGPTImage` and `/requestGemini` take no auth,
  so each one checks the body it was given (`messages` / `contents` / `prompt`, and `model`
  and `n` when present) and answers `400 INVALID_REQUEST` instead of spending the key on a
  body the upstream cannot read. An `apiKey`, `url` or `headers` field in the body is dropped
  before forwarding: the key comes from `.env` and the address from the server config.
  A body they do accept gets the same treatment as every other route: an unset key answers
  `503 AI_NOT_CONFIGURED` and an upstream failure `502 UPSTREAM_FAILED`, with the variable
  name and the upstream error in the server log only. `GEMINI_URL` carries its key in the
  address, so the upstream error string in particular must not go back to the caller.
- **Collabo patch** — the patched image makes a disconnected collaborator disappear immediately
  (upstream waits ~30s); see `docker/collabo.Dockerfile`.
- **Apple Silicon (M-series Mac)** — the backend images are built for amd64 only. `docker-compose.yml`
  pins each service to `platform: linux/amd64`, so Docker Desktop runs them under emulation. Turn on
  *Settings → General → Use Rosetta for x86_64/amd64 emulation on Apple Silicon* for faster conversion.
  This is fine for trying the demo; run production backends on an x86_64 Linux server.
- **Windows / WSL2** — the converter needs `vsyscall=emulate`. Add to `C:\Users\<you>\.wslconfig`:
  `[wsl2]` then `kernelCommandLine = vsyscall=emulate`, then `wsl --shutdown` and restart Docker Desktop.
```
