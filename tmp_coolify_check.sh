#!/bin/bash
set -e

echo "=== Check Coolify API tokens ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, token_encrypted FROM personal_access_tokens LIMIT 5;" 2>&1

echo "=== Check Coolify webhook settings ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, uuid, git_commit_sha FROM applications WHERE name ILIKE '%API%' OR name ILIKE '%Web%';" 2>&1

echo "=== Check if Coolify has deploy webhooks ==="
docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, uuid, manual_webhook_secret_github FROM applications;" 2>&1

echo "=== Check Coolify version ==="
docker exec coolify cat /var/www/html/.env 2>/dev/null | grep -E 'APP_ID|COOLIFY_' | head -5

echo "=== Check Coolify API endpoint ==="
curl -s http://localhost:8000/api/v1/version 2>&1 | head -c 200

echo ""
echo "DONE"
