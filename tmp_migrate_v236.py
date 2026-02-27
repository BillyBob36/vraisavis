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

# Step 1: Change Docker image tag to v2.3.6
r = subprocess.run(
    ['curl', '-s', '-X', 'PATCH',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json',
     '-d', '{"docker_registry_image_tag":"v2.3.6"}'],
    capture_output=True, text=True
)
print(f"Image tag update: {r.stdout[:80]}")

# Step 2: Cleanup env vars
envs = get_envs()
env_map = {e['key']: e for e in envs}

# Keys to delete (obsolete in v2.3.x)
to_delete = ['CONFIG_SESSION_PHONE_VERSION']
# Keys to ensure correct values
to_set = {
    'LOG_BAILEYS': 'error',
    'CONFIG_SESSION_PHONE_NAME': 'Chrome',
}

for key in to_delete:
    for e in envs:
        if e['key'] == key:
            print(f"Deleting obsolete {key}={e['value']}")
            delete_env(e['uuid'])

# Re-fetch after deletions
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}

for key, val in to_set.items():
    current = env_map2.get(key)
    if current and current['value'] != val:
        print(f"Fixing {key}: {current['value']} -> {val}")
        delete_env(current['uuid'])
        result = add_env(key, val)
        print(f"  -> {result.get('uuid', result)}")
    elif not current:
        result = add_env(key, val)
        print(f"Adding {key}={val} -> {result.get('uuid', result)}")
    else:
        print(f"OK {key}={val}")

# Final verification
envs3 = get_envs()
env_map3 = {e['key']: e for e in envs3}
print("\n=== Final env state ===")
for k in ['LOG_BAILEYS', 'CONFIG_SESSION_PHONE_NAME', 'CONFIG_SESSION_PHONE_VERSION',
          'DATABASE_SAVE_DATA_AUTH_CHAIN', 'CONFIG_SESSION_PHONE_CLIENT']:
    e = env_map3.get(k, {})
    print(f"  {k}={e.get('value', 'NOT SET')}")

# Step 3: Redeploy
r = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print(f"\nRedeploy queued: {r.stdout[:120]}")
