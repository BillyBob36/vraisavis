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

# Delete ALL occurrences of CONFIG_SESSION_PHONE_NAME then recreate
envs = get_envs()
for e in envs:
    if e['key'] == 'CONFIG_SESSION_PHONE_NAME':
        print(f"Deleting {e['key']}={e['value']} ({e['uuid']})")
        delete_env(e['uuid'])

result = add_env('CONFIG_SESSION_PHONE_NAME', 'Chrome')
print(f"Created CONFIG_SESSION_PHONE_NAME=Chrome → {result.get('uuid', result)}")

# Final verification
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}
print("\n=== Final state ===")
for k in ['LOG_BAILEYS', 'CONFIG_SESSION_PHONE_VERSION', 'CONFIG_SESSION_PHONE_NAME']:
    e = env_map2.get(k, {})
    print(f"  {k}={e.get('value', 'NOT SET')}")
print(f"\nTotal env vars: {len(envs2)}")
