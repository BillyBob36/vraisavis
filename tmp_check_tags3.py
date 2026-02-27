import json, subprocess

# Get all pages to find v2.x tags
all_tags = []
url = 'https://hub.docker.com/v2/repositories/atendai/evolution-api/tags?page_size=100&ordering=-last_updated'
r = subprocess.run(['curl', '-s', url], capture_output=True, text=True)
d = json.loads(r.stdout)
all_tags = [t['name'] for t in d.get('results', [])]

v2_tags = [t for t in all_tags if t.startswith('v2') or t == 'latest']
print("v2.x tags available:")
for t in sorted(v2_tags):
    print(f"  {t}")
