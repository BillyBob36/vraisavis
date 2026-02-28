import subprocess, json

result = subprocess.run([
    'docker', 'exec', 'x4osww00skows0ck4g0k4ogo',
    'psql', '-U', 'vraisavis', '-d', 'vraisavis',
    '-c', 'SELECT id, name, whatsapp_number, whatsapp_verified FROM users WHERE whatsapp_number IS NOT NULL LIMIT 10;'
], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
