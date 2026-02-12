#!/bin/bash
# Find Place ID for "Le Dauphin" via the API container
docker exec x840o4o8gwgccsoscs0gckok-100808020753 node -e "
const KEY = process.env.GOOGLE_PLACES_API_KEY;
fetch('https://places.googleapis.com/v1/places:searchText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
  },
  body: JSON.stringify({
    textQuery: 'Le Dauphin 131 avenue Parmentier Paris',
    languageCode: 'fr',
    maxResultCount: 3,
  }),
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2))).catch(e => console.error(e));
"
