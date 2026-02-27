#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID="xck88kk4880ocoss4wgoswsk"

echo "=== Updating Evolution API image to latest ==="
curl -s -X PATCH "http://localhost:8000/api/v1/applications/$EVO_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"docker_registry_image_tag":"latest"}' \
  | python3 -m json.tool 2>/dev/null | head -10

echo ""
echo "=== Redeploying ==="
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=$EVO_UUID&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo ""
echo "=== Done ==="
