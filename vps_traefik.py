#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

# Add traefik labels to expose instagrapi via HostHeader (or just path-based)
DOCKER_COMPOSE_CONTENT = """
services:
  api:
    build: .
    stdin_open: true
    tty: true
    volumes:
      - .:/app
    networks:
      - easypanel
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.instagrapi.rule=Host(`46.62.144.244`)"
      - "traefik.http.routers.instagrapi.entrypoints=web"
      - "traefik.http.services.instagrapi.loadbalancer.server.port=8000"

networks:
  easypanel:
    external: true
"""

COMMANDS = [
    ("Update compose file", f"cat << 'EOF' > /home/chandan/instagrapi-rest/docker-compose.yml\n{DOCKER_COMPOSE_CONTENT}\nEOF"),
    ("Restart instagrapi container", "cd /home/chandan/instagrapi-rest && docker compose up -d --force-recreate"),
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
            print(f"\n### {label}\n$ {cmd}\n{out or err or '(no output)'}")
    except Exception as e:
        print(f"❌ SSH error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
