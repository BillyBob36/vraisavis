#!/bin/bash
RESP=$(curl -s 'http://localhost:8000/api/v1/deployments/fg08s8444wgswcwk088ocwgc' \
  -H 'Authorization: Bearer 5|srEvk7SpuWCBprkEoACRJTB56RnuTTv60X07c6ut')
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Status:', d.get('status'))
logs = d.get('logs', '')
# Find error lines
for line in logs.split('\\\\n'):
    if 'ERR' in line or 'error' in line.lower() or 'failed' in line.lower():
        print(line[:200])
"
