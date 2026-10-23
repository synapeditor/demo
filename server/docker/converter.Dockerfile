# Local patch on top of the converter-api image (pulled from GHCR, Node 24): keep
# the extracted media (don't delete the output dir) and write it to a runner-provided
# outputId folder, so imported images resolve. Paired with the shared volume in
# docker-compose.yml.
FROM ghcr.io/synapeditor/converter-api:1.0.1
COPY converter-server.js /app/server.js
