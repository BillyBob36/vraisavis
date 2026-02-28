import subprocess

r = subprocess.run(
    ['docker', 'exec', 'x4osww00skows0ck4g0k4ogo', 'psql', '-U', 'vraisavis', '-d', 'vraisavis', '-c',
     'SELECT id, manager_id, phone_number, code, verified, expires_at FROM messaging_verifications ORDER BY "createdAt" DESC LIMIT 10;'],
    capture_output=True, text=True
)
print(r.stdout)
print(r.stderr)
