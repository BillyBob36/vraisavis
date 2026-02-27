#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

# Get fresh QR as base64 image
RESP=$(curl -s "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" -H "apikey: $EVO_KEY")
B64=$(echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else [d]
for i in items:
    b = i.get('base64', '')
    if b:
        # Remove data:image/png;base64, prefix if present
        if ',' in b:
            b = b.split(',', 1)[1]
        print(b)
        break
" 2>/dev/null)

if [ -n "$B64" ]; then
    echo "$B64" | base64 -d > /tmp/qr_code.png
    echo "QR code saved as PNG: /tmp/qr_code.png"
    echo "Size: $(wc -c < /tmp/qr_code.png) bytes"
    # Also save the data URL for browser display
    echo "data:image/png;base64,$B64" > /tmp/qr_dataurl.txt
    echo "Data URL saved: /tmp/qr_dataurl.txt"
    echo ""
    echo "CODE (for pairing): $(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else [d];[print(i.get('code','')) for i in items if i.get('code')]" 2>/dev/null)"
else
    echo "No QR available. Try: curl -s https://evolution.vraisavis.fr/instance/connect/vraisavis-bot -H 'apikey: $EVO_KEY'"
fi
