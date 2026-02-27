#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
API_UUID="x840o4o8gwgccsoscs0gckok"

# Get existing env ID for EVOLUTION_API_URL
ENV_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/applications/$API_UUID/envs" \
  | python3 -c "import sys,json; envs=json.load(sys.stdin); [print(e['id']) for e in envs if e['key']=='EVOLUTION_API_URL']")

echo "Existing env ID: $ENV_ID"

# Update to use internal Docker network URL
curl -s -X PATCH "http://localhost:8000/api/v1/applications/$API_UUID/envs/$ENV_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"EVOLUTION_API_URL","value":"http://xck88kk4880ocoss4wgoswsk-180631526009:8080","is_preview":false}' | python3 -m json.tool | head -5

echo "=== Done ==="
