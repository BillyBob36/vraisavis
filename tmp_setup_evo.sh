#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
UUID="xck88kk4880ocoss4wgoswsk"

# 1. Set domain
echo "=== Setting FQDN ==="
curl -s -X PATCH "http://localhost:8000/api/v1/applications/$UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fqdn": "https://evolution.vraisavis.fr"}' | python3 -m json.tool | head -5

# 2. Add environment variables
echo "=== Adding env vars ==="

add_env() {
  local key="$1"
  local val="$2"
  curl -s -X POST "http://localhost:8000/api/v1/applications/$UUID/envs" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"value\":\"$val\",\"is_preview\":false}" | python3 -m json.tool | grep -E 'message|uuid'
}

# Server
add_env "SERVER_URL" "https://evolution.vraisavis.fr"

# Auth
add_env "AUTHENTICATION_API_KEY" "VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

# Telemetry off
add_env "TELEMETRY_ENABLED" "false"

# Database - use the existing VraisAvis PostgreSQL (pgvector container)
add_env "DATABASE_PROVIDER" "postgresql"
add_env "DATABASE_CONNECTION_URI" "postgresql://vraisavis:lhjFnHpspV6goKnHDp7H2yuuPuTF3igmUBeWVnu12Q@x4osww00skows0ck4g0k4ogo:5432/evolution_api?schema=evolution"
add_env "DATABASE_CONNECTION_CLIENT_NAME" "vraisavis_evolution"

# Save data
add_env "DATABASE_SAVE_DATA_INSTANCE" "true"
add_env "DATABASE_SAVE_DATA_NEW_MESSAGE" "true"
add_env "DATABASE_SAVE_MESSAGE_UPDATE" "true"
add_env "DATABASE_SAVE_DATA_CONTACTS" "true"
add_env "DATABASE_SAVE_DATA_CHATS" "true"

# Logs
add_env "LOG_LEVEL" "ERROR,WARN,INFO"
add_env "LOG_BAILEYS" "error"

# Instance config
add_env "DEL_INSTANCE" "false"
add_env "CONFIG_SESSION_PHONE_CLIENT" "VraisAvis"
add_env "CONFIG_SESSION_PHONE_NAME" "Chrome"

# CORS
add_env "CORS_ORIGIN" "*"
add_env "CORS_METHODS" "GET,POST,PUT,DELETE"
add_env "CORS_CREDENTIALS" "true"

# QR Code
add_env "QRCODE_LIMIT" "30"

# Webhook global → VraisAvis API
add_env "WEBHOOK_GLOBAL_ENABLED" "true"
add_env "WEBHOOK_GLOBAL_URL" "https://api.vraisavis.fr/api/v1/whatsapp/webhook"
add_env "WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS" "false"
add_env "WEBHOOK_EVENTS_MESSAGES_UPSERT" "true"
add_env "WEBHOOK_EVENTS_CONNECTION_UPDATE" "true"
add_env "WEBHOOK_EVENTS_QRCODE_UPDATED" "true"
add_env "WEBHOOK_EVENTS_MESSAGES_SET" "false"
add_env "WEBHOOK_EVENTS_MESSAGES_UPDATE" "false"
add_env "WEBHOOK_EVENTS_MESSAGES_DELETE" "false"
add_env "WEBHOOK_EVENTS_SEND_MESSAGE" "false"
add_env "WEBHOOK_EVENTS_CONTACTS_SET" "false"
add_env "WEBHOOK_EVENTS_CONTACTS_UPSERT" "false"
add_env "WEBHOOK_EVENTS_CONTACTS_UPDATE" "false"
add_env "WEBHOOK_EVENTS_PRESENCE_UPDATE" "false"
add_env "WEBHOOK_EVENTS_CHATS_SET" "false"
add_env "WEBHOOK_EVENTS_CHATS_UPSERT" "false"
add_env "WEBHOOK_EVENTS_CHATS_UPDATE" "false"
add_env "WEBHOOK_EVENTS_CHATS_DELETE" "false"
add_env "WEBHOOK_EVENTS_GROUPS_UPSERT" "false"
add_env "WEBHOOK_EVENTS_GROUPS_UPDATE" "false"
add_env "WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE" "false"
add_env "WEBHOOK_EVENTS_LABELS_EDIT" "false"
add_env "WEBHOOK_EVENTS_LABELS_ASSOCIATION" "false"
add_env "WEBHOOK_EVENTS_CALL" "false"

# Disable integrations we don't need
add_env "TYPEBOT_ENABLED" "false"
add_env "CHATWOOT_ENABLED" "false"
add_env "OPENAI_ENABLED" "false"
add_env "DIFY_ENABLED" "false"
add_env "N8N_ENABLED" "false"

# Disable extra transports
add_env "RABBITMQ_ENABLED" "false"
add_env "SQS_ENABLED" "false"
add_env "WEBSOCKET_ENABLED" "false"

# Cache local only (no Redis needed for now)
add_env "CACHE_LOCAL_ENABLED" "true"
add_env "CACHE_REDIS_ENABLED" "false"

# S3 disabled
add_env "S3_ENABLED" "false"

# Language
add_env "LANGUAGE" "fr"

echo "=== Done ==="
