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
- **Backend images** — the base images (`collabo-ws`, `converter-api`, `export-api`) are pulled from
  `ghcr.io/synapeditor/*` (public). `docker compose up` pulls them and builds the patched
  `collabo-ws-patched` / `converter-api-patched` images (tag `node22`) locally; both copy the base
  image's app onto `node:22-bookworm-slim`. `export-api` runs as published (`:0.0.10`, Node 24).
  If you ran the demo before this change, `docker compose up -d` picks up the new images on its own.
  Maintainers republish collabo/converter with `docker/publish-base-images.sh`; export-api is built
  and published from the `export_api` repo.
- **Collabo patch** — the patched image makes a disconnected collaborator disappear immediately
  (upstream waits ~30s); see `docker/collabo.Dockerfile`.
- **Windows / WSL2** — the converter needs `vsyscall=emulate`. Add to `C:\Users\<you>\.wslconfig`:
  `[wsl2]` then `kernelCommandLine = vsyscall=emulate`, then `wsl --shutdown` and restart Docker Desktop.
```
