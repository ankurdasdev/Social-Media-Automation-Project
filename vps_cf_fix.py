#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

DOCKER_COMPOSE_CONTENT = """
services:
  api:
    build: .
    stdin_open: true
    tty: true
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    networks:
      - easypanel

networks:
  easypanel:
    external: true
"""

COMMANDS = [
    ("Update compose file", f"cat << 'EOF' > /home/chandan/instagrapi-rest/docker-compose.yml\n{DOCKER_COMPOSE_CONTENT}\nEOF"),
    ("Restart instagrapi container", "cd /home/chandan/instagrapi-rest && docker compose up -d"),
    ("Wait", "sleep 3"),
    ("Restart Cloudflared to localhost:8000", "pkill cloudflared || true; nohup ./cloudflared tunnel --url http://127.0.0.1:8000 > cloudflared.log 2>&1 &"),
    ("Wait CF", "sleep 5"),
    ("Get Tunnel URL", "grep -o 'https://[a-zA-Z0-9-]*\\.trycloudflare\\.com' cloudflared.log | head -1")
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
