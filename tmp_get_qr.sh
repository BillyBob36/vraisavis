#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Polling QR code for vraisavis-bot ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
  echo "Attempt $i..."
  RESULT=$(curl -s "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" \
    -H "apikey: $EVO_KEY")
  
  # Check if base64 QR is present
  HAS_B64=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d if isinstance(d,list) else [d]; print(any(i.get('base64') for i in items))" 2>/dev/null)
  
  if [ "$HAS_B64" = "True" ]; then
    echo "QR code found!"
    echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else [data]
for item in items:
    b64 = item.get('base64','')
    code = item.get('code','')
    if b64:
        with open('/tmp/qr_base64.txt', 'w') as f:
            f.write(b64)
        print('Saved to /tmp/qr_base64.txt')
        print('QR code (text):', code)
"
    break
  else
    echo "Not ready yet: $RESULT" | head -c 100
    sleep 5
  fi
done
