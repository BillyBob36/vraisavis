#!/bin/bash
# Approach 1: Try artisan deploy command
echo "=== Trying artisan deploy ==="
docker exec coolify php artisan app:deploy x840o4o8gwgccsoscs0gckok 2>&1 | head -5
docker exec coolify php artisan app:deploy y4cokwkkcks8k4k8wcw440cc 2>&1 | head -5

# Approach 2: If artisan doesn't work, create token properly
echo "=== Creating API token ==="
docker exec coolify php artisan tinker --execute="
\$user = \App\Models\User::first();
// Delete old cascade tokens
\App\Models\PersonalAccessToken::where('name','cascade-deploy')->delete();
\$token = \$user->createToken('cascade-deploy');
echo \$token->plainTextToken;
" 2>&1

echo "=== Listing artisan commands ==="
docker exec coolify php artisan list --raw 2>/dev/null | grep -i deploy | head -10
