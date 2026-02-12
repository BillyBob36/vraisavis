#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"

echo "=== Adding GOOGLE_PLACES_API_KEY to API ==="
curl -s -X POST "http://localhost:8000/api/v1/applications/x840o4o8gwgccsoscs0gckok/envs" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"GOOGLE_PLACES_API_KEY","value":"AIzaSyD5YzF_0dcPilVOL3H0urgyE7n1WYzghzA","is_preview":false}'
echo

echo "=== Deploying API ==="
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=x840o4o8gwgccsoscs0gckok&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo

echo "=== Deploying Web ==="
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=y4cokwkkcks8k4k8wcw440cc&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo

echo "=== Done ==="
