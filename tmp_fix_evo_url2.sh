#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
API_UUID="x840o4o8gwgccsoscs0gckok"

EVO_CONTAINER=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "Evolution container: $EVO_CONTAINER"
INTERNAL_URL="http://${EVO_CONTAINER}:8080"
echo "Internal URL: $INTERNAL_URL"

# Delete ALL existing EVOLUTION_API_URL envs
for UUID in $(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/applications/$API_UUID/envs" | python3 -c "import sys,json;[print(e['uuid']) for e in json.load(sys.stdin) if e['key']=='EVOLUTION_API_URL']"); do
  echo "Deleting old env $UUID"
  curl -s -X DELETE "http://localhost:8000/api/v1/applications/$API_UUID/envs/$UUID" -H "Authorization: Bearer $TOKEN"
done

# Create new
curl -s -X POST "http://localhost:8000/api/v1/applications/$API_UUID/envs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"EVOLUTION_API_URL\",\"value\":\"$INTERNAL_URL\",\"is_preview\":false}"

echo ""
echo "=== Done ==="
