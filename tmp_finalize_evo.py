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

envs = get_envs()
env_map = {e['key']: e for e in envs}

# Revert LOG_BAILEYS to error
log = env_map.get('LOG_BAILEYS')
if log:
    print(f"LOG_BAILEYS current: {log['value']}")
    delete_env(log['uuid'])
    print("Add LOG_BAILEYS=error:", add_env('LOG_BAILEYS', 'error')[:60])

# Print final state of key vars
envs2 = get_envs()
env_map2 = {e['key']: e for e in envs2}
for k in ['LOG_BAILEYS', 'CONFIG_SESSION_PHONE_VERSION', 'CONFIG_SESSION_PHONE_NAME', 'WHATSAPP_DEFAULT_INSTANCE']:
    e = env_map2.get(k, {})
    print(f"  {k}={e.get('value', 'NOT SET')}")
