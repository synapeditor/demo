# Local patch on top of the collabo-ws base image (pulled from GHCR).
# Upstream only clears a disconnected collaborator's awareness via a ~30s outdated
# timeout; this overlays a server.js that removes it immediately on socket close.
# Only the base image lives in the registry; the patched image is built locally.
FROM ghcr.io/synapeditor/collabo-ws:latest
COPY collabo-server.js /app/src/server.js
