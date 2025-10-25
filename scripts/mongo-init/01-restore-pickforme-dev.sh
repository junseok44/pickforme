#!/bin/bash
set -euo pipefail

# This script runs inside the official mongo image during first-time init
# It restores the pickforme-dev database from a local dump if the DB is empty

DB_NAME="${MONGO_INITDB_DATABASE:-pickforme-dev}"
BACKUP_DIR="/backups/${DB_NAME}"

if [ ! -d "${BACKUP_DIR}" ]; then
  echo "[mongo-init] Backup directory not found: ${BACKUP_DIR}. Skipping restore."
  exit 0
fi

echo "[mongo-init] Waiting for mongod to be ready..."
for i in {1..60}; do
  if mongosh --quiet --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[mongo-init] Checking if database '${DB_NAME}' is empty..."
COLLECTION_COUNT=$(mongosh --quiet --eval "db.getSiblingDB('${DB_NAME}').getCollectionNames().length") || COLLECTION_COUNT=0

if [ "${COLLECTION_COUNT}" = "0" ] || [ -z "${COLLECTION_COUNT}" ]; then
  echo "[mongo-init] Restoring '${DB_NAME}' from ${BACKUP_DIR} ..."
  mongorestore --dir="${BACKUP_DIR}" --db="${DB_NAME}" --drop
  echo "[mongo-init] Restore completed."
else
  echo "[mongo-init] Database '${DB_NAME}' already has ${COLLECTION_COUNT} collections. Skipping restore."
fi


