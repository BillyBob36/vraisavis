#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID="xck88kk4880ocoss4wgoswsk"

# DEL_INSTANCE already false, but monitoring still removes instances
# We need to check what env var controls the monitoring interval/behavior

echo "=== All env vars currently set ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/applications/$EVO_UUID/envs" \
  | python3 -c "
import sys, json
envs = json.load(sys.stdin)
for e in sorted(envs, key=lambda x: x['key']):
    print(f\"{e['key']}={e['value']}\")
"
