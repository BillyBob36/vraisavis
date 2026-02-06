#!/bin/bash
# Create a new API token and deploy

# Create token via tinker
RESULT=$(docker exec coolify php artisan tinker --execute="
\$user = \App\Models\User::first();
\$token = \$user->createToken('cascade-deploy');
echo \$token->plainTextToken;
" 2>/dev/null)

TOKEN=$(echo "$RESULT" | tail -1 | tr -d '[:space:]')
echo "Token: ${TOKEN:0:30}..."

echo "=== Deploying API ==="
curl -s -X POST "http://localhost:8000/api/v1/applications/x840o4o8gwgccsoscs0gckok/restart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null
echo ""

echo "=== Deploying Web ==="
curl -s -X POST "http://localhost:8000/api/v1/applications/y4cokwkkcks8k4k8wcw440cc/restart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null
echo ""
