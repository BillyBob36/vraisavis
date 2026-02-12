#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"

echo "=== API build logs (last failed) ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/deployments/wk00ogsk4ok88g4owck8g8ss" | python3 -c "
import sys,json
d=json.load(sys.stdin)
log = d.get('logs','')
lines = log.strip().split('\n')
for l in lines[-30:]:
    print(l)
"

echo ""
echo "=== Web build logs (last failed) ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/deployments/dw0g4swss44o848wk8kww44w" | python3 -c "
import sys,json
d=json.load(sys.stdin)
log = d.get('logs','')
lines = log.strip().split('\n')
for l in lines[-30:]:
    print(l)
"
