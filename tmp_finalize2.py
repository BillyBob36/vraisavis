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
    resp = json.loads(r.stdout)
    return resp.get('uuid', resp.get('message', '?'))

envs = get_envs()
env_map = {e['key']: e for e in envs}

updates = {
    'LOG_BAILEYS': 'error',
    'CONFIG_SESSION_PHONE_NAME': 'Chrome',
}

for key, val in updates.items():
    current = env_map.get(key)
    if current:
        delete_env(current['uuid'])
    result = add_env(key, val)
    print(f"{key}={val} → {result[:50]}")

# Final state
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}
print("\n=== Final state ===")
for k in ['LOG_BAILEYS', 'CONFIG_SESSION_PHONE_VERSION', 'CONFIG_SESSION_PHONE_NAME']:
    e = env_map2.get(k, {})
    print(f"  {k}={e.get('value', 'NOT SET')}")
