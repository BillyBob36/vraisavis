import json, subprocess

TOKEN = "6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID = "xck88kk4880ocoss4wgoswsk"

# Get latest deployment
r = subprocess.run(
    ['curl', '-s', '-H', f'Authorization: Bearer {TOKEN}',
     f'http://localhost:8000/api/v1/applications/{EVO_UUID}/deployments?per_page=3'],
    capture_output=True, text=True
)
deploys = json.loads(r.stdout)
data = deploys.get('data', deploys) if isinstance(deploys, dict) else deploys
for d in data[:3]:
    print(f"Deployment: {d.get('deployment_uuid')} status={d.get('status')} created={d.get('created_at','')[:19]}")

# Get last deployment logs
if data:
    last_uuid = data[0].get('deployment_uuid')
    r2 = subprocess.run(
        ['curl', '-s', '-H', f'Authorization: Bearer {TOKEN}',
         f'http://localhost:8000/api/v1/deployments/{last_uuid}'],
        capture_output=True, text=True
    )
    logs_data = json.loads(r2.stdout)
    logs = logs_data.get('logs', '')
    if logs:
        # Show last 2000 chars
        print(f"\nLast deployment logs (last 2000 chars):\n{logs[-2000:]}")
    else:
        print(f"\nNo logs field, keys: {list(logs_data.keys())[:10]}")
