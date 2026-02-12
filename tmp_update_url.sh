#!/bin/bash
docker exec x4osww00skows0ck4g0k4ogo psql -U vraisavis -d vraisavis -c "UPDATE restaurants SET google_review_url = 'https://search.google.com/local/writereview?placeid=ChIJjcveyeNt5kcR5xm7bVyEib0' WHERE google_review_url = 'https://maps.app.goo.gl/m6TsNcqSa8GGLfsr8';"
docker exec x4osww00skows0ck4g0k4ogo psql -U vraisavis -d vraisavis -t -A -c "SELECT name, google_review_url FROM restaurants;"
