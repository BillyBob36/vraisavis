#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
PHONE="306998120577"

# Delete existing
echo "=== Deleting old instance ==="
curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" \
  -H "apikey: $EVO_KEY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null

sleep 1

# Create new
echo "=== Creating fresh instance ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status','?'))" 2>/dev/null

# Poll connection state and immediately request pairing code when connecting
echo "=== Polling state and requesting pairing code ==="
for i in $(seq 1 20); do
  sleep 2
  STATE=$(curl -s "https://evolution.vraisavis.fr/instance/connectionState/vraisavis-bot" \
    -H "apikey: $EVO_KEY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('instance',{}).get('state', d.get('state','?')))" 2>/dev/null)
  echo "  [$i] State: $STATE"

  if [ "$STATE" = "connecting" ]; then
    echo "=== Requesting pairing code NOW ==="
    RESULT=$(curl -s -X POST "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" \
      -H "apikey: $EVO_KEY" \
      -H "Content-Type: application/json" \
      --data-raw "{\"number\": \"$PHONE\"}")
    echo "Result: $RESULT" | head -c 300

    # Also try the /pairingCode endpoint
    RESULT2=$(curl -s -X POST "https://evolution.vraisavis.fr/pairing-code/vraisavis-bot" \
      -H "apikey: $EVO_KEY" \
      -H "Content-Type: application/json" \
      --data-raw "{\"phoneNumber\": \"$PHONE\"}")
    echo "Result2: $RESULT2" | head -c 300
    break
  fi

  if [ "$STATE" = "open" ]; then
    echo "Already connected!"
    break
  fi
done
