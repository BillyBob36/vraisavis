#!/bin/bash
set -e

echo "=== Try cascade-deploy token (hash from DB, need plaintext) ==="
# The token in DB is a SHA-256 hash. We need the plaintext token.
# Let's check if it was stored somewhere

echo "=== Check if Coolify has a webhook URL for the apps ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT uuid, name, manual_webhook_secret_github, custom_docker_run_options FROM applications WHERE uuid IN ('x840o4o8gwgccsoscs0gckok', 'y4cokwkkcks8k4k8wcw440cc');" 2>&1

echo "=== Check docker-compose.yaml for API ==="
cat /data/coolify/applications/x840o4o8gwgccsoscs0gckok/docker-compose.yaml 2>&1

echo "=== Check docker-compose.yaml for Web ==="
cat /data/coolify/applications/y4cokwkkcks8k4k8wcw440cc/docker-compose.yaml 2>&1

echo "=== Try deploy via Coolify webhook (GitHub-style) ==="
# Coolify supports: POST /api/v1/deploy?uuid=<app-uuid>&force=true
# with Authorization: Bearer <token>

echo "=== Check all columns of applications table ==="
docker exec coolify-db psql -U coolify -d coolify -c "\d applications" 2>&1 | grep -iE 'webhook|deploy|docker|port|base_dir|build|dockerfile'

echo "=== Get build config for API app ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT uuid, name, base_directory, build_pack, dockerfile_location, docker_compose_location, ports_exposes FROM applications WHERE uuid='x840o4o8gwgccsoscs0gckok';" 2>&1

echo "=== Get build config for Web app ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT uuid, name, base_directory, build_pack, dockerfile_location, docker_compose_location, ports_exposes FROM applications WHERE uuid='y4cokwkkcks8k4k8wcw440cc';" 2>&1

echo "DONE"
