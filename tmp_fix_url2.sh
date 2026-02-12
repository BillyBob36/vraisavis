#!/bin/bash
CONTAINER=$(docker ps --format '{{.Names}}' | grep x840o4o8gwgccsoscs0gckok | head -1)

docker exec $CONTAINER node -e "
const KEY = process.env.GOOGLE_PLACES_API_KEY;

async function resolve() {
  const res = await fetch('https://maps.app.goo.gl/m6TsNcqSa8GGLfsr8', { method: 'GET', redirect: 'follow' });
  const finalUrl = res.url;

  // Extract name and coordinates
  const match = finalUrl.match(/\/maps\/place\/([^\/@]+)\/@([\d.-]+),([\d.-]+)/);
  const placeName = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  const lat = match ? parseFloat(match[2]) : null;
  const lng = match ? parseFloat(match[3]) : null;
  console.log('Name:', placeName, 'Lat:', lat, 'Lng:', lng);

  // Search with location bias
  const body = {
    textQuery: placeName,
    languageCode: 'fr',
    maxResultCount: 1,
  };
  if (lat && lng) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 500.0 }
    };
  }

  const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify(body),
  });
  const data = await searchRes.json();
  console.log(JSON.stringify(data, null, 2));
}
resolve().catch(e => console.error(e));
"
