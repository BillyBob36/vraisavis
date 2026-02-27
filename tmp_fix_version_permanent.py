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

envs = get_envs()
env_map = {e['key']: e for e in envs}

# Change CONFIG_SESSION_PHONE_VERSION to match the native baileys version in v2.2.2 image
# Native version in v2.2.2: 1019707846
current = env_map.get('CONFIG_SESSION_PHONE_VERSION')
if current:
    print(f"Current: CONFIG_SESSION_PHONE_VERSION={current['value']}")
    delete_env(current['uuid'])

result = add_env('CONFIG_SESSION_PHONE_VERSION', '2.3000.1019707846')
print(f"New: CONFIG_SESSION_PHONE_VERSION=2.3000.1019707846 → {result.get('uuid', result)}")

# Verify
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}
e = env_map2.get('CONFIG_SESSION_PHONE_VERSION', {})
print(f"Verified: {e.get('value', 'NOT SET')}")
