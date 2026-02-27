import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"

# Latest stable from wppconnect.io as of 2026-02-27
LATEST_VERSION = "2.3000.1034191470"

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

# Delete any existing CONFIG_SESSION_PHONE_VERSION
for e in envs:
    if e['key'] == 'CONFIG_SESSION_PHONE_VERSION':
        print(f"Deleting old: {e['value']}")
        delete_env(e['uuid'])

# Add latest
result = add_env('CONFIG_SESSION_PHONE_VERSION', LATEST_VERSION)
print(f"Set CONFIG_SESSION_PHONE_VERSION={LATEST_VERSION} -> {result.get('uuid', result)}")

# Also patch baileys-version.json in the CURRENT container (before redeploy)
EVO_CONTAINER = subprocess.run(
    ['ssh', '-i', '/root/.ssh/coolify-key', 'localhost',
     "docker ps --format '{{.Names}}' | grep xck88kk4 | head -1"],
    capture_output=True, text=True
).stdout.strip()

# Patch via docker exec directly
patch_cmd = f"echo '{{\"version\":[2,3000,{LATEST_VERSION.split('.')[-1]}]}}' | docker exec -i xck88kk4880ocoss4wgoswsk-121126963227 sh -c 'cat > /evolution/node_modules/baileys/lib/Defaults/baileys-version.json'"
result2 = subprocess.run(patch_cmd, shell=True, capture_output=True, text=True)
print(f"Patched baileys-version.json: {result2.returncode}")

# Redeploy
r = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print(f"Redeploy: {r.stdout[:100]}")
