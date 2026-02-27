#!/bin/bash
# Get a manager token first, then test the whatsapp-link endpoint
TOKEN=$(curl -s -X POST https://api.vraisavis.fr/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"test"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','NO_TOKEN'))")

echo "Token: $TOKEN"

# Check if whatsapp-link returns botPhone
RESULT=$(curl -s -X POST https://api.vraisavis.fr/api/v1/manager/messaging/whatsapp-link \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $RESULT"
