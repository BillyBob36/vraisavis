import json, subprocess

# Test fetchInstances raw response
r = subprocess.run(
    ['curl', '-s', 'https://evolution.vraisavis.fr/instance/fetchInstances',
     '-H', 'apikey: VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8'],
    capture_output=True, text=True
)
d = json.loads(r.stdout)
print("Keys in first instance:", list(d[0].keys()) if d else "empty")
print("name:", d[0].get('name'))
print("ownerJid:", d[0].get('ownerJid'))
print("connectionStatus:", d[0].get('connectionStatus'))
