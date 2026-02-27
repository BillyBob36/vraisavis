import json, subprocess

r = subprocess.run(
    ['curl', '-s', 'https://evolution.vraisavis.fr/instance/fetchInstances',
     '-H', 'apikey: VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8'],
    capture_output=True, text=True
)
d = json.loads(r.stdout)
for i in d:
    inst = i.get('instance', {})
    name = inst.get('instanceName', '?')
    owner = inst.get('owner', 'non connecté')
    state = inst.get('connectionStatus', '?')
    print(f"Instance: {name}  |  Numéro: {owner}  |  État: {state}")
