import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko
import time

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("Get API Container IP", "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' instagrapi-rest-api-1"),
    ("Kill old", "pkill cloudflared || true"),
    ("Start Cloudflare with Container IP", """
        IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' instagrapi-rest-api-1 | head -1)
        nohup ./cloudflared tunnel --url http://$IP:8000 > cloudflared.log 2>&1 &
    """),
    ("Wait", "sleep 5"),
    ("Get URL", "grep -o 'https://[a-zA-Z0-9-]*\\.trycloudflare\\.com' cloudflared.log | head -1"),
]

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
        for label, cmd in COMMANDS:
            stdin, stdout, stderr = client.exec_command(cmd)
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            print(f"### {label}\n{out or err}\n")
    except Exception as e:
        print(f"❌ SSH error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
