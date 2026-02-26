#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
curl -s -X POST "http://localhost:8000/api/v1/applications/dockerimage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_uuid": "esww84wgkogscs8co8kgo44w",
    "environment_name": "production",
    "server_uuid": "coc84cwwkgsg48sos844k0s4",
    "name": "Evolution API",
    "description": "WhatsApp gateway via Evolution API",
    "docker_registry_image_name": "atendai/evolution-api",
    "docker_registry_image_tag": "v2.2.3",
    "ports_exposes": "8080",
    "instant_deploy": false
  }' | python3 -m json.tool
