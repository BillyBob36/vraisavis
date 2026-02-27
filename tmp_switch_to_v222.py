import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"

# Switch to v2.2.2
r = subprocess.run(
    ['curl', '-s', '-X', 'PATCH',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json',
     '-d', '{"docker_registry_image_tag":"v2.2.2"}'],
    capture_output=True, text=True
)
print("Patch:", r.stdout[:100])

# Redeploy
r2 = subprocess.run(
    ['curl', '-s', '-X', 'POST',
     f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
     '-H', f'Authorization: Bearer {TOKEN}',
     '-H', 'Content-Type: application/json'],
    capture_output=True, text=True
)
print("Deploy:", r2.stdout[:150])
