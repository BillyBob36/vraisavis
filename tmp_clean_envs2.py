import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"

# Get all envs
result = subprocess.run(
    ['curl', '-s', '-H', f'Authorization: Bearer {TOKEN}',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs'],
    capture_output=True, text=True
)

data = json.loads(result.stdout)
print(f"Total env vars: {len(data)}")

seen = {}
to_delete = []

for e in data:
    k = e['key']
    uuid = e['uuid']
    if k in seen:
        to_delete.append((k, uuid))
    else:
        seen[k] = {'uuid': uuid, 'value': e['value']}

print(f"Duplicates to delete: {len(to_delete)}")

for k, uuid in to_delete:
    r = subprocess.run(
        ['curl', '-s', '-X', 'DELETE',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs/{uuid}',
         '-H', f'Authorization: Bearer {TOKEN}'],
        capture_output=True, text=True
    )
    print(f"  Deleted duplicate {k}: {r.stdout[:50]}")

print(f"\nUnique keys remaining: {len(seen)}")

# Now update CONFIG_SESSION_PHONE_NAME to Firefox
phone_name_uuid = seen.get('CONFIG_SESSION_PHONE_NAME', {}).get('uuid')
log_uuid = seen.get('LOG_BAILEYS', {}).get('uuid')

print(f"\nCONFIG_SESSION_PHONE_NAME uuid: {phone_name_uuid} (current: {seen.get('CONFIG_SESSION_PHONE_NAME',{}).get('value')})")
print(f"LOG_BAILEYS uuid: {log_uuid} (current: {seen.get('LOG_BAILEYS',{}).get('value')})")

if phone_name_uuid:
    r = subprocess.run(
        ['curl', '-s', '-X', 'PATCH',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs/{phone_name_uuid}',
         '-H', f'Authorization: Bearer {TOKEN}',
         '-H', 'Content-Type: application/json',
         '-d', '{"key":"CONFIG_SESSION_PHONE_NAME","value":"Firefox","is_preview":false}'],
        capture_output=True, text=True
    )
    print(f"Updated PHONE_NAME: {r.stdout[:80]}")

if log_uuid:
    r = subprocess.run(
        ['curl', '-s', '-X', 'PATCH',
         f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs/{log_uuid}',
         '-H', f'Authorization: Bearer {TOKEN}',
         '-H', 'Content-Type: application/json',
         '-d', '{"key":"LOG_BAILEYS","value":"debug","is_preview":false}'],
        capture_output=True, text=True
    )
    print(f"Updated LOG_BAILEYS: {r.stdout[:80]}")

# Redeploy
r = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print(f"\nRedeploy: {r.stdout[:120]}")
