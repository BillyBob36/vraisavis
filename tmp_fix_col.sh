#!/bin/bash
set -e

DB_CONTAINER="x4osww00skows0ck4g0k4ogo"
API_CONTAINER="x840o4o8gwgccsoscs0gckok-225511236261"

echo "=== Rename commission_rate to commissionRate ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c 'ALTER TABLE "vendors" RENAME COLUMN "commission_rate" TO "commissionRate";'

echo "=== Check vendor_contracts columns ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name FROM information_schema.columns WHERE table_name='vendor_contracts' AND column_name LIKE 'vendor_%' ORDER BY ordinal_position;"

echo "=== Rename vendor_contracts snake_case columns to camelCase ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c '
ALTER TABLE "vendor_contracts" RENAME COLUMN "vendor_phone" TO "vendorPhone";
ALTER TABLE "vendor_contracts" RENAME COLUMN "vendor_statut" TO "vendorStatut";
ALTER TABLE "vendor_contracts" RENAME COLUMN "vendor_tva" TO "vendorTVA";
ALTER TABLE "vendor_contracts" RENAME COLUMN "vendor_tva_number" TO "vendorTVANumber";
ALTER TABLE "vendor_contracts" RENAME COLUMN "vendor_city" TO "vendorCity";
' 2>&1 || echo "Some renames may have already been done"

echo "=== Verify vendors columns ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name FROM information_schema.columns WHERE table_name='vendors' AND column_name LIKE 'commission%';"

echo "=== Verify vendor_contracts columns ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name FROM information_schema.columns WHERE table_name='vendor_contracts' AND column_name LIKE 'vendor%' ORDER BY ordinal_position;"

echo "=== Restart API ==="
docker restart "$API_CONTAINER"
sleep 5

echo "=== Test login ==="
curl -s -X POST https://api.vraisavis.fr/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://app.vraisavis.fr' \
  -d '{"email":"test@test.com","password":"testtest"}' | head -c 300
echo ""

echo "=== API logs ==="
docker logs --tail 5 "$API_CONTAINER" 2>&1
echo "DONE"
