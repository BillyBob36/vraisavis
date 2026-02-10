#!/bin/bash
set -e

TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"

echo "=== Test API: list applications ==="
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/applications 2>&1 | python3 -m json.tool 2>/dev/null | head -50

echo ""
echo "=== Get API app details ==="
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/applications/x840o4o8gwgccsoscs0gckok 2>&1 | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "=== Get Web app details ==="
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/applications/y4cokwkkcks8k4k8wcw440cc 2>&1 | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "=== Test deploy endpoint (dry run - just check if it exists) ==="
curl -s -X GET -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/deploy 2>&1 | head -c 200

echo ""
echo "=== Check deployments endpoint ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/applications/x840o4o8gwgccsoscs0gckok/deployments?limit=2" 2>&1 | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "DONE"
