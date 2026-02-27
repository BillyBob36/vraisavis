import json, subprocess

images = ['latest', 'v2.2.3', 'v2.2.2', 'v2.2.1', 'v2.2.0', 'v2.1.3-homolog']

for tag in images:
    r = subprocess.run(
        ['docker', 'run', '--rm', '--entrypoint', '',
         f'atendai/evolution-api:{tag}',
         'cat', '/evolution/node_modules/baileys/lib/Defaults/baileys-version.json'],
        capture_output=True, text=True, timeout=30
    )
    if r.returncode == 0:
        try:
            d = json.loads(r.stdout)
            ver = d.get('version', [])
            print(f"{tag}: {ver}")
        except:
            print(f"{tag}: {r.stdout[:80]}")
    else:
        print(f"{tag}: ERROR - {r.stderr[:60]}")
