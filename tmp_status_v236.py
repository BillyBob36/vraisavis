import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"
EVO_KEY = "VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

# Check current image tag
r = subprocess.run(
    ['curl', '-s', '-H', f'Authorization: Bearer {TOKEN}',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}'],
    capture_output=True, text=True
)
app = json.loads(r.stdout)
print(f"Image tag in Coolify: {app.get('docker_registry_image_tag')}")
print(f"Status: {app.get('status')}")

# Check running container image
r2 = subprocess.run(
    ['docker', 'ps', '--format', '{{.Names}} {{.Image}} {{.CreatedAt}}'],
    capture_output=True, text=True
)
for line in r2.stdout.splitlines():
    if 'xck88kk4' in line:
        print(f"Running container: {line}")

# If still on v2.2.2, force redeploy
if 'v2.2.2' in r2.stdout:
    print("\nStill on v2.2.2, forcing redeploy with v2.3.6...")
    r3 = subprocess.run(
        ['curl', '-s', '-X', 'POST',
         f'http://localhost:8000/api/v1/deploy?uuid={EVO_UUID}&force=true',
         '-H', f'Authorization: Bearer {TOKEN}',
         '-H', 'Content-Type: application/json'],
        capture_output=True, text=True
    )
    print(f"Deploy: {r3.stdout[:100]}")
