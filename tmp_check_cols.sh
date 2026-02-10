#!/bin/bash
DB_CONTAINER="x4osww00skows0ck4g0k4ogo"
echo "=== All vendor columns ==="
docker exec "$DB_CONTAINER" psql -U vraisavis -d vraisavis -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vendors' ORDER BY ordinal_position;"
