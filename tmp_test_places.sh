#!/bin/bash
KEY=$(docker exec x840o4o8gwgccsoscs0gckok-094800308427 printenv GOOGLE_PLACES_API_KEY)
echo "API Key: $KEY"
curl -s -X POST "https://places.googleapis.com/v1/places:searchText" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $KEY" \
  -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress" \
  -d '{"textQuery":"Le Bouillon Chartier Paris","languageCode":"fr","includedType":"restaurant","maxResultCount":1}'
