import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"

# Get latest deployments
r = subprocess.run(
    ['curl', '-s', '-H', f'Authorization: Bearer {TOKEN}',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}/deployments?per_page=3'],
    capture_output=True, text=True
)
raw = json.loads(r.stdout)
print(f"Response type: {type(raw)}, keys: {list(raw.keys()) if isinstance(raw, dict) else 'list'}")

# Handle both list and dict response
deploys = raw.get('data', []) if isinstance(raw, dict) else raw
for d in deploys[:3]:
    print(f"  uuid={d.get('deployment_uuid')} status={d.get('status')} at={str(d.get('created_at',''))[:19]}")
