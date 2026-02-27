import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"

# Add CONFIG_SESSION_PHONE_VERSION
r = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}/envs',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json',
     '-d', json.dumps({"key": "CONFIG_SESSION_PHONE_VERSION", "value": "2.3000.1034183557", "is_preview": False})],
    capture_output=True, text=True
)
print("Add env:", r.stdout[:100])

# Redeploy
r2 = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print("Deploy:", r2.stdout[:150])
