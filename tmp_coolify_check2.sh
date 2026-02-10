#!/bin/bash
set -e

echo "=== Check Coolify API tokens ==="
docker exec coolify-db psql -U coolify -d coolify -c "\d personal_access_tokens" 2>&1 | head -20

echo "=== Get API tokens ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, substring(token, 1, 30) as token_start FROM personal_access_tokens LIMIT 5;" 2>&1

echo "=== Get app UUIDs and webhook secrets ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, uuid, manual_webhook_secret_github FROM applications;" 2>&1

echo "=== Check Coolify .env for API key ==="
docker exec coolify cat /var/www/html/.env 2>/dev/null | grep -iE 'API_TOKEN|COOLIFY_AUTO' | head -5

echo "=== Test Coolify API with bearer ==="
TOKEN=$(docker exec coolify-db psql -U coolify -d coolify -t -c "SELECT token FROM personal_access_tokens LIMIT 1;" 2>/dev/null | tr -d ' \n')
echo "Token found: ${TOKEN:0:20}..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/applications 2>&1 | head -c 500

echo ""
echo "DONE"
