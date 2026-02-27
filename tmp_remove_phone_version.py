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
    r = subprocess.run(
        ['curl', '-s', '-X', 'DELETE',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs/{uuid}',
         '-H', f'Authorization: Bearer {TOKEN}'],
        capture_output=True, text=True
    )
    return r.stdout

envs = get_envs()

# Delete ALL occurrences of CONFIG_SESSION_PHONE_VERSION
deleted = 0
for e in envs:
    if e['key'] == 'CONFIG_SESSION_PHONE_VERSION':
        print(f"Deleting CONFIG_SESSION_PHONE_VERSION={e['value']} ({e['uuid']})")
        result = delete_env(e['uuid'])
        print(f"  -> {result[:60]}")
        deleted += 1

if deleted == 0:
    print("CONFIG_SESSION_PHONE_VERSION not found")

# Verify it's gone
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}
if 'CONFIG_SESSION_PHONE_VERSION' not in env_map2:
    print("\nCONFIG_SESSION_PHONE_VERSION successfully removed")
else:
    print(f"\nWARN: Still present: {env_map2['CONFIG_SESSION_PHONE_VERSION']['value']}")

# Redeploy
r = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print(f"\nRedeploy: {r.stdout[:120]}")
