import subprocess

# Get a fresh valid walink code from DB
r = subprocess.run(
    ['docker', 'exec', 'x4osww00skows0ck4g0k4ogo', 'psql', '-U', 'vraisavis', '-d', 'vraisavis', '-c',
     "SELECT code, expires_at, verified FROM messaging_verifications WHERE phone_number='whatsapp-link' AND verified=false ORDER BY \"createdAt\" DESC LIMIT 3;"],
    capture_output=True, text=True
)
print("=== Valid walink codes ===")
print(r.stdout)
print(r.stderr)

# Also check current time on server
r2 = subprocess.run(
    ['docker', 'exec', 'x4osww00skows0ck4g0k4ogo', 'psql', '-U', 'vraisavis', '-d', 'vraisavis', '-c',
     "SELECT NOW();"],
    capture_output=True, text=True
)
print("=== Server time ===")
print(r2.stdout)

# Check if webhook is actually receiving messages by checking recent logs
r3 = subprocess.run(
    ['docker', 'logs', 'x840o4o8gwgccsoscs0gckok-142849670660', '--tail', '30'],
    capture_output=True, text=True
)
print("=== API recent logs ===")
print(r3.stdout)
print(r3.stderr)
