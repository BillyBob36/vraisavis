import json, subprocess

r = subprocess.run(
    ['curl', '-s',
     'https://hub.docker.com/v2/repositories/atendai/evolution-api/tags?page_size=20&ordering=-last_updated'],
    capture_output=True, text=True
)
d = json.loads(r.stdout)
tags = [t['name'] for t in d.get('results', [])]
print("Available tags (latest first):")
for t in tags:
    print(f"  {t}")
