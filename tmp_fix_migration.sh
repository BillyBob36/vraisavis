#!/bin/bash
set -e

DB_CONTAINER="x4osww00skows0ck4g0k4ogo"
API_CONTAINER="x840o4o8gwgccsoscs0gckok-225511236261"

echo "=== Check if commission_rate column exists ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name FROM information_schema.columns WHERE table_name='vendors' AND column_name='commission_rate';"

echo "=== Check migration history ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"

echo "=== Read migration SQL file ==="
docker exec "$API_CONTAINER" cat prisma/migrations/20260210_update_vendor_contract_fields/migration.sql

echo "=== Apply migration SQL directly ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS commission_rate DOUBLE PRECISION DEFAULT 50;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS vendor_phone TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS vendor_statut TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS vendor_tva TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS vendor_tva_number TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS vendor_city TEXT;
"

echo "=== Verify columns exist now ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vendors' AND column_name='commission_rate';"
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name FROM information_schema.columns WHERE table_name='vendor_contracts' AND column_name IN ('vendor_phone','vendor_statut','vendor_tva','vendor_tva_number','vendor_city');"

echo "=== Test login endpoint ==="
sleep 2
curl -s -X POST https://api.vraisavis.fr/api/v1/auth/login -H 'Content-Type: application/json' -H 'Origin: https://app.vraisavis.fr' -d '{"email":"test@test.com","password":"test"}' | head -c 200
echo ""
echo "=== DONE ==="
