#!/bin/bash
set -e

TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
API_UUID="x840o4o8gwgccsoscs0gckok"
WEB_UUID="y4cokwkkcks8k4k8wcw440cc"

echo "=== 1. Clean orphan containers ==="
# Remove manually created containers that Coolify doesn't manage
docker ps -a --format '{{.Names}}' | grep -E 'x840o4o8|y4cokwkk' | while read name; do
  echo "Removing orphan: $name"
  docker rm -f "$name" 2>/dev/null || true
done

echo ""
echo "=== 2. Deploy API via Coolify API ==="
RESULT=$(curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=$API_UUID&force=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "API deploy response: $RESULT"

echo ""
echo "=== 3. Deploy Web via Coolify API ==="
RESULT=$(curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=$WEB_UUID&force=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "Web deploy response: $RESULT"

echo ""
echo "=== 4. Wait and check status ==="
sleep 10
echo "--- Containers ---"
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'x840o4o8|y4cokwkk'

echo ""
echo "DONE - Deployments triggered. Monitor in Coolify UI."
