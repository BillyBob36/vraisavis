#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Creating instance vraisavis-bot ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -m json.tool 2>/dev/null

echo ""
echo "=== Waiting 5s then fetching QR ==="
sleep 5

RESULT=$(curl -s "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" \
  -H "apikey: $EVO_KEY")

echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else [data]
for item in items:
    b64 = item.get('base64','')
    code = item.get('code','')
    if b64:
        print('QR BASE64 (copy to browser):', b64[:80], '...')
        # Save full base64 to file
        with open('/tmp/qr_base64.txt', 'w') as f:
            f.write(b64)
        print('Full base64 saved to /tmp/qr_base64.txt')
    if code:
        print('QR CODE:', code)
    if not b64 and not code:
        print('No QR yet, raw:', json.dumps(item)[:200])
" 2>/dev/null || echo "Raw: $RESULT" | head -c 500
