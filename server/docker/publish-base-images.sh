#!/usr/bin/env bash
# Publish the demo backend BASE images to GHCR (maintainers only).
#
# These base images are NOT committed to git — they exceed GitHub's 100 MB limit.
# They live in the public registry ghcr.io/synapeditor/* and are pulled
# automatically by `docker compose up`. Run this whenever a base image changes.
#
# Prerequisites:
#   - The three *.tar files present in this directory
#     (collabo-ws.tar, converter-api.tar, export-api.tar).
#   - A GitHub PAT with `write:packages`, then log in once:
#       echo "$GHCR_PAT" | docker login ghcr.io -u <github-user> --password-stdin
#   - On the FIRST push, set each package's visibility to Public in the GitHub UI
#     (Packages → <image> → Package settings → Change visibility → Public),
#     otherwise `docker compose up` on a fresh clone cannot pull them.
set -euo pipefail

REGISTRY="ghcr.io/synapeditor"
TAG="${TAG:-latest}"
DIR="$(cd "$(dirname "$0")" && pwd)"

publish() {
  local tar="$1" repo="$2"
  echo "==> $tar → $REGISTRY/$repo:$TAG"
  # `docker load` prints "Loaded image: <name>:<tag>"; use it so we tag the exact
  # image regardless of the tar's internal repo tag.
  local loaded
  loaded="$(docker load -i "$DIR/$tar" | sed -n 's/^Loaded image: //p' | head -1)"
  if [ -z "$loaded" ]; then
    echo "ERROR: could not determine the loaded image name from $tar" >&2
    exit 1
  fi
  docker tag "$loaded" "$REGISTRY/$repo:$TAG"
  docker push "$REGISTRY/$repo:$TAG"
}

publish collabo-ws.tar    collabo-ws
publish converter-api.tar converter-api
publish export-api.tar    export-api

echo "Done. On first publish, set the three packages to Public in the GitHub UI."
