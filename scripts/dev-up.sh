#!/bin/bash

set -euo pipefail

# Usage: ./scripts/dev-up.sh [--build] [service...]
# Default: bring up the whole dev stack in foreground

COMPOSE_FILE="docker-compose.dev.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "docker-compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

# Pass all args through to docker compose up
exec docker compose -f "$COMPOSE_FILE" up "$@"
