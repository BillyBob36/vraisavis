#!/bin/bash
# Create token with team_id and deploy
echo "=== Creating API token with team ==="
TOKEN=$(docker exec coolify php artisan tinker --execute="
\$user = \App\Models\User::first();
\$team = \App\Models\Team::first();
\App\Models\PersonalAccessToken::where('name','cascade-deploy')->delete();
\$pat = new \App\Models\PersonalAccessToken();
\$pat->tokenable_type = 'App\\\Models\\\User';
\$pat->tokenable_id = \$user->id;
\$pat->name = 'cascade-deploy';
\$pat->token = hash('sha256', \$plain = \Illuminate\Support\Str::random(40));
\$pat->abilities = ['*'];
\$pat->team_id = \$team->id;
\$pat->save();
echo \$pat->id . '|' . \$plain;
" 2>&1 | tail -1)

echo "Raw: $TOKEN"
PAT_ID=$(echo "$TOKEN" | cut -d'|' -f1)
PLAIN=$(echo "$TOKEN" | cut -d'|' -f2)
BEARER="${PAT_ID}|${PLAIN}"
echo "Bearer: ${BEARER:0:30}..."

echo "=== Deploying API ==="
curl -s -X POST "http://localhost:8000/api/v1/applications/x840o4o8gwgccsoscs0gckok/restart" \
  -H "Authorization: Bearer $BEARER" \
  -H "Content-Type: application/json" 2>/dev/null
echo ""

echo "=== Deploying Web ==="
curl -s -X POST "http://localhost:8000/api/v1/applications/y4cokwkkcks8k4k8wcw440cc/restart" \
  -H "Authorization: Bearer $BEARER" \
  -H "Content-Type: application/json" 2>/dev/null
echo ""
