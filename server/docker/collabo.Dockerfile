# Local patch on top of the bundled collabo-ws image (loaded from collabo-ws.tar).
# Upstream only clears a disconnected collaborator's awareness via a ~30s outdated
# timeout; this overlays a server.js that removes it immediately on socket close.
# Build stays in this repo — nothing is pushed to a registry.
FROM collabo-ws
COPY collabo-server.js /app/src/server.js
