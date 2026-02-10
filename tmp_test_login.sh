#!/bin/bash
echo "=== Test login endpoint ==="
curl -s -X POST https://api.vraisavis.fr/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://app.vraisavis.fr' \
  -d '{"email":"test@test.com","password":"testtest"}' | head -c 500
echo ""

echo "=== Check last API logs ==="
docker logs --tail 5 x840o4o8gwgccsoscs0gckok-225511236261 2>&1
echo "=== DONE ==="
