#!/bin/bash
docker exec x4osww00skows0ck4g0k4ogo psql -U vraisavis -d vraisavis -t -A -c "SELECT name, \"googleReviewUrl\" FROM restaurants LIMIT 5;"
