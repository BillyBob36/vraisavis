import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"

def get_envs():
    r = subprocess.run(
        ['curl', '-s', '-H', f'Authorization: Bearer {TOKEN}',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs'],
        capture_output=True, text=True
    )
    return json.loads(r.stdout)

def delete_env(uuid):
    subprocess.run(
        ['curl', '-s', '-X', 'DELETE',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs/{uuid}',
         '-H', f'Authorization: Bearer {TOKEN}'],
        capture_output=True, text=True
    )

def add_env(key, value):
    r = subprocess.run(
        ['curl', '-s', '-X', 'POST',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs',
         '-H', f'Authorization: Bearer {TOKEN}',
         '-H', 'Content-Type: application/json',
         '-d', json.dumps({"key": key, "value": value, "is_preview": False})],
        capture_output=True, text=True
    )
    return json.loads(r.stdout)

# Remove all old CONFIG_SESSION_PHONE_VERSION and add the current one
envs = get_envs()
for e in envs:
    if e['key'] == 'CONFIG_SESSION_PHONE_VERSION':
        print(f"Removing: {e['value']}")
        delete_env(e['uuid'])

# Current stable version from wppconnect.io (2026-02-27)
NEW_VERSION = "2.3000.1034191470"
result = add_env('CONFIG_SESSION_PHONE_VERSION', NEW_VERSION)
print(f"Added CONFIG_SESSION_PHONE_VERSION={NEW_VERSION} -> {result.get('uuid','?')}")

# Also fix image tag back to v2.2.3 (latest stable that exists)
r = subprocess.run(
    ['curl', '-s', '-X', 'PATCH',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json',
     '-d', '{"docker_registry_image_tag":"v2.2.3"}'],
    capture_output=True, text=True
)
print(f"Image tag set to v2.2.3: {r.stdout[:60]}")

# Verify env state
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}
print("\n=== Key env vars ===")
for k in ['CONFIG_SESSION_PHONE_VERSION', 'LOG_BAILEYS', 'CONFIG_SESSION_PHONE_NAME', 'CONFIG_SESSION_PHONE_CLIENT']:
    e = env_map2.get(k, {})
    print(f"  {k}={e.get('value', 'NOT SET')}")

# Redeploy
r = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print(f"\nRedeploy: {r.stdout[:100]}")
