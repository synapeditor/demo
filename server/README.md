# SynapEditor — Server Feature Demos

A developer example for SynapEditor's **server-dependent** features —
**import · export · image upload · collaboration**. Each feature has its own demo
page under [`../html/server-features/`](../html/server-features) and its own server route, so you can
study and configure them one at a time. The editor SDK is loaded from the CDN.

## Quick start (all features)

```bash
# 1) Load the backend images (first time only)
docker load -i docker/export-api.tar
docker load -i docker/converter-api.tar
docker load -i docker/collabo-ws.tar

# 2) Start the backends (builds the patched collabo image on first run)
docker compose up -d

# 3) Start the demo server
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
└── docker/                # export-api.tar · converter-api.tar · collabo-ws.tar
                           # collabo.Dockerfile + collabo-server.js  (collabo patch)
```

## Notes

- **License** — uses the repo-root `license.config.js` (served at `/license.config.js`), same as the static demos.
- **Ports** — defaults: collabo `1234`, export `9090`, converter `8080`. If `8080` is busy, put
  `CONVERTER_PORT=18080` and `CONVERTER_SERVER=http://localhost:18080` in `.env` (see `.env.example`).
- **Collabo patch** — `docker compose up` builds `collabo-ws-patched` from `docker/collabo.Dockerfile`
  so a disconnected collaborator disappears immediately (upstream waits ~30s). Local build only —
  nothing is pushed to a registry.
- **Windows / WSL2** — the converter needs `vsyscall=emulate`. Add to `C:\Users\<you>\.wslconfig`:
  `[wsl2]` then `kernelCommandLine = vsyscall=emulate`, then `wsl --shutdown` and restart Docker Desktop.
```
