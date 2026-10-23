# Local patch on top of the collabo-ws base image (pulled from GHCR).
# Upstream only clears a disconnected collaborator's awareness via a ~30s outdated
# timeout; this overlays a server.js that removes it immediately on socket close.
# The base image ships Node 18, so only its /app (and the global pm2 it runs under)
# is copied onto a Node 22 runtime.
# Only the base image lives in the registry; the patched image is built locally.
FROM ghcr.io/synapeditor/collabo-ws:latest AS base

# Keep this runtime the same in collabo/converter Dockerfiles and the compose image tags.
FROM node:22-bookworm-slim
COPY --from=base /usr/local/lib/node_modules/pm2 /usr/local/lib/node_modules/pm2
RUN ln -s ../lib/node_modules/pm2/bin/pm2 /usr/local/bin/pm2 \
    && ln -s ../lib/node_modules/pm2/bin/pm2-runtime /usr/local/bin/pm2-runtime
COPY --from=base /app /app
WORKDIR /app
COPY collabo-server.js /app/src/server.js
EXPOSE 1234
CMD ["pm2-runtime", "start", "src/server.js"]
