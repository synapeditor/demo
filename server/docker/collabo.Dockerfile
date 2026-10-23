# Local patch on top of the collabo-ws image (pulled from GHCR, built from the
# synapeditorcollabo repo on Node 24). Upstream only clears a disconnected
# collaborator's awareness via a ~30s outdated timeout; this overlays its server.js
# with one that also removes it immediately on socket close.
# collabo-server.js is upstream 1.0.23's src/server.js plus that one block
# (marked "[데모 패치]"). Re-derive it whenever the base tag below changes.
FROM ghcr.io/synapeditor/collabo-ws:1.0.23
COPY collabo-server.js /app/src/server.js
