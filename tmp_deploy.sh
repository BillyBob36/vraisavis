#!/bin/bash
# Find Coolify API token
TOKEN=$(docker exec coolify php artisan tinker --execute="echo \App\Models\PersonalAccessToken::first()->token;" 2>/dev/null)
echo "Token prefix: ${TOKEN:0:20}..."

# List applications
APPS=$(docker exec coolify php artisan tinker --execute="echo json_encode(\App\Models\Application::all()->map(function(\$a){return ['uuid'=>\$a->uuid,'name'=>\$a->name];}));" 2>/dev/null)
echo "Apps: $APPS"

# Get API and Web UUIDs
API_UUID=$(echo "$APPS" | grep -o '"uuid":"[^"]*"' | head -1 | cut -d'"' -f4)
WEB_UUID=$(echo "$APPS" | grep -o '"uuid":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
echo "API UUID: $API_UUID"
echo "WEB UUID: $WEB_UUID"
