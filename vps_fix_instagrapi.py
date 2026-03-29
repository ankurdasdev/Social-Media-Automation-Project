#!/usr/bin/env python3
"""
Fix the instagrapi-rest Docker setup on the VPS.
1. Update requirements (fastapi, uvicorn, starlette) to fix the asyncio error.
2. Rebuild the docker image.
3. Restart the container via docker-compose.
4. Check logs and curl localhost.
"""
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko
import time

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("Update requirements", """cat << 'EOF' > /home/chandan/instagrapi-rest/requirements.txt
fastapi>=0.85.0
uvicorn>=0.18.3
instagrapi>=1.16.30
python-multipart>=0.0.5
Pillow>=8.1.1
requests>=2.26.0
pydantic<2.0.0
starlette>=0.20.0
tinydb>=4.5.1
moviepy==1.0.3
httpx>=0.17.1
EOF"""),
    ("Rebuild docker image", "cd /home/chandan/instagrapi-rest && docker compose build"),
    ("Stop old container", "cd /home/chandan/instagrapi-rest && docker compose down"),
    ("Start new container", "cd /home/chandan/instagrapi-rest && docker compose up -d"),
    ("Wait 5s", "sleep 5"),
    ("Check logs", "docker logs instagrapi-rest-api-1 --tail 50"),
    ("Test local curl", "curl -s http://localhost:8000/docs | head -10")
]

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
        print(f"✅ Connected to {HOST}")
        for label, cmd in COMMANDS:
            print(f"\n### {label}\n$ {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
            
            # Print output as it arrives for long-running commands like build
            for line in iter(stdout.readline, ""):
                print(line, end="")
            err = stderr.read().decode().strip()
            if err:
                print(f"STDERR logs:\n{err}")
                
        print("\n✅ Done.")
    except Exception as e:
        print(f"❌ SSH error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
