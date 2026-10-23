# Local patch on top of converter-api: keep the extracted media (don't delete the
# output dir) and write it to a runner-provided outputId folder, so imported images
# resolve. Paired with the shared volume in docker-compose.yml.
# The base image ships Node 16 on Ubuntu 18.04, whose glibc is too old for Node 22,
# so only its /app is copied onto a Node 22 runtime (sedocConverter_exe is static).
# The base image is pulled from GHCR; the patched image is built locally.
FROM ghcr.io/synapeditor/converter-api:latest AS base

# Keep this runtime the same in collabo/converter Dockerfiles and the compose image tags.
FROM node:22-bookworm-slim
COPY --from=base /app /app
WORKDIR /app
COPY converter-server.js /app/server.js
EXPOSE 8080
CMD ["node", "server.js"]
