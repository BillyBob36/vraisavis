#!/bin/bash
set -e

API_CONTAINER="x840o4o8gwgccsoscs0gckok-225511236261"
DB_CONTAINER="x4osww00skows0ck4g0k4ogo"

echo "=== 1. Check actual DB column names for vendors ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name FROM information_schema.columns WHERE table_name='vendors' ORDER BY ordinal_position;"

echo "=== 2. Check Prisma schema in container ==="
docker exec "$API_CONTAINER" grep -A5 'commissionRate\|commission_rate' prisma/schema.prisma 2>/dev/null || echo "Not found in schema"

echo "=== 3. Check if Prisma Client was generated with commissionRate ==="
docker exec "$API_CONTAINER" grep -r 'commissionRate' node_modules/.prisma/client/index.js 2>/dev/null | head -3 || echo "Not found in generated client"

echo "=== 4. Check migration SQL ==="
docker exec "$API_CONTAINER" cat prisma/migrations/20260210_update_vendor_contract_fields/migration.sql

echo "=== 5. Try prisma db pull to see actual schema ==="
docker exec "$API_CONTAINER" npx prisma db pull --print 2>&1 | grep -A3 'commission' || echo "db pull failed"

echo "DONE"
