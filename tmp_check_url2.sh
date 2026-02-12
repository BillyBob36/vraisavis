#!/bin/bash
docker exec x4osww00skows0ck4g0k4ogo psql -U vraisavis -d vraisavis -t -A -c "SELECT column_name FROM information_schema.columns WHERE table_name='restaurants' AND column_name LIKE '%google%';"
docker exec x4osww00skows0ck4g0k4ogo psql -U vraisavis -d vraisavis -t -A -c "SELECT column_name FROM information_schema.columns WHERE table_name='restaurants' AND column_name LIKE '%review%';"
docker exec x4osww00skows0ck4g0k4ogo psql -U vraisavis -d vraisavis -t -A -c "SELECT name, \"googleReviewUrl\" FROM restaurants LIMIT 5;" 2>&1 || true
docker exec x4osww00skows0ck4g0k4ogo psql -U vraisavis -d vraisavis -t -A -c "SELECT name, google_review_url FROM restaurants LIMIT 5;" 2>&1 || true
