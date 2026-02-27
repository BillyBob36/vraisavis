#!/bin/bash
# Login as a manager and test the whatsapp-link endpoint
TOKEN=$(curl -s -X POST https://api.vraisavis.fr/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"manager@test.com","password":"password123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token', d.get('accessToken','')))")

echo "Token: ${TOKEN:0:40}..."

if [ -z "$TOKEN" ]; then
  echo "No token - trying to list managers from DB"
  docker exec $(docker ps --format '{{.Names}}' | grep x840o4o8 | head -1) \
    sh -c "NODE_PATH=/app/node_modules node -e \"
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.manager.findMany({take:3, select:{id:true,email:true}}).then(r => console.log(JSON.stringify(r))).catch(e=>console.error(e)).finally(()=>p.\$disconnect());
\""
else
  echo "Testing whatsapp-link..."
  curl -s -X POST https://api.vraisavis.fr/api/v1/manager/messaging/whatsapp-link \
    -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))"
fi
