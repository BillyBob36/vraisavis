import subprocess, json

r = subprocess.run(
    ['curl', '-s', '-X', 'GET',
     'https://evolution.vraisavis.fr/webhook/find/vraisavis-bot',
     '-H', 'apikey: VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8'],
    capture_output=True, text=True
)
data = json.loads(r.stdout)
print("enabled:", data.get("enabled"))
print("url:", data.get("url"))
print("webhookByEvents:", data.get("webhookByEvents"))
print("events:")
for e in data.get("events", []):
    print(" ", e)
