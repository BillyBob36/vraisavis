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

def add_env(key, value):
    r = subprocess.run(
        ['curl', '-s', '-X', 'POST',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs',
         '-H', f'Authorization: Bearer {TOKEN}',
         '-H', 'Content-Type: application/json',
         '-d', json.dumps({"key": key, "value": value, "is_preview": False})],
        capture_output=True, text=True
    )
    return r.stdout

# Get current state
envs = get_envs()
print(f"Current env count: {len(envs)}")

# Build lookup
env_map = {e['key']: e for e in envs}

# Keys to update
updates = {
    'CONFIG_SESSION_PHONE_NAME': 'Firefox',
    'LOG_BAILEYS': 'warn',
}

for key, new_val in updates.items():
    current = env_map.get(key)
    if current:
        print(f"Deleting old {key}={current['value']} (uuid={current['uuid']})")
        print("  ", delete_env(current['uuid'])[:60])

    print(f"Adding {key}={new_val}")
    print("  ", add_env(key, new_val)[:80])

# Verify
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}
for key in updates:
    e = env_map2.get(key, {})
    print(f"  Final {key}={e.get('value','NOT FOUND')}")

# Redeploy
print("\nRedeploying...")
r = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print(r.stdout[:150])
