# Local patch on top of converter-api: keep the extracted media (don't delete the
# output dir) and write it to a runner-provided outputId folder, so imported images
# resolve. Paired with the shared volume in docker-compose.yml. The base image is
# pulled from GHCR; the patched image is built locally.
FROM ghcr.io/synapeditor/converter-api:latest
COPY converter-server.js /app/server.js
