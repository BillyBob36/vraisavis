#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
UUID="xck88kk4880ocoss4wgoswsk"

# Try setting domains via PATCH
curl -s -X PATCH "http://localhost:8000/api/v1/applications/$UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domains": "https://evolution.vraisavis.fr"}' | python3 -m json.tool | head -10
