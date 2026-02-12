#!/bin/bash
# Resolve the Google Maps URL to a writereview URL via the API container
CONTAINER=$(docker ps --format '{{.Names}}' | grep x840o4o8gwgccsoscs0gckok | head -1)
echo "Using container: $CONTAINER"

docker exec $CONTAINER node -e "
const KEY = process.env.GOOGLE_PLACES_API_KEY;

async function resolve() {
  // 1. Follow redirect
  const res = await fetch('https://maps.app.goo.gl/m6TsNcqSa8GGLfsr8', { method: 'GET', redirect: 'follow' });
  const finalUrl = res.url;
  console.log('Final URL:', finalUrl);

  // 2. Extract place name
  const match = finalUrl.match(/\/maps\/place\/([^\/@]+)/);
  const placeName = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  console.log('Place name:', placeName);

  if (!placeName) { console.log('ERROR: Could not extract place name'); return; }

  // 3. Search Place ID
  const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: placeName, languageCode: 'fr', maxResultCount: 1 }),
  });
  const data = await searchRes.json();
  console.log('Result:', JSON.stringify(data, null, 2));

  if (data.places && data.places[0]) {
    const placeId = data.places[0].id;
    const reviewUrl = 'https://search.google.com/local/writereview?placeid=' + placeId;
    console.log('Review URL:', reviewUrl);
  }
}
resolve().catch(e => console.error(e));
"
