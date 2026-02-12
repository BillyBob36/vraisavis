#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"

echo "=== API deployment status ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/deployments/wk00ogsk4ok88g4owck8g8ss" | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('status','?'))"

echo "=== Web deployment status ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/deployments/dw0g4swss44o848wk8kww44w" | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('status','?'))"

echo "=== Re-deploying ==="
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=x840o4o8gwgccsoscs0gckok&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=y4cokwkkcks8k4k8wcw440cc&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo
echo "=== Done ==="
