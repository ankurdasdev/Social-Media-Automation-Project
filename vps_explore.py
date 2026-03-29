#!/usr/bin/env python3
"""
Check the instagrapi container logs, its docker-compose config, and test the API.
"""
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("instagrapi container logs",   "docker logs instagrapi-rest-api-1 --tail 30 2>&1"),
    ("hiker/insta-api crash logs",  "docker logs hiker_insta-api.1.vzmlprqumgs25fvqw1ovh5nmf 2>&1 | tail -20"),
    ("docker-compose in folder",    "cat /home/chandan/instagrapi-rest/docker-compose.yml"),
    ("requirements.txt",            "cat /home/chandan/instagrapi-rest/requirements.txt"),
    ("main.py",                     "cat /home/chandan/instagrapi-rest/main.py"),
    ("routers list",                "ls /home/chandan/instagrapi-rest/routers/"),
    ("Test current API /",          "curl -s --max-time 5 http://localhost:8000/ 2>&1"),
    ("Test current API /health",    "curl -s --max-time 5 http://localhost:8000/health 2>&1"),
    ("Test /docs",                  "curl -s --max-time 5 http://localhost:8000/docs 2>&1 | head -5"),
    ("Test /user/by_username",      "curl -s -X POST http://localhost:8000/user/by_username -H 'Content-Type: application/json' -d '{\"username\": \"test\"}' 2>&1"),
    ("Evolution API status",        "curl -s --max-time 5 http://localhost:3000/ 2>&1 | head -5"),
    ("Easypanel on port 3000",      "curl -s --max-time 3 http://localhost:3000/ 2>&1 | head -3"),
]

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
        print(f"✅ Connected\n{'='*60}")
        for label, cmd in COMMANDS:
            stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            result = out or err or "(no output)"
            print(f"\n### {label}\n{result}")
        print(f"\n{'='*60}\n✅ Done.")
    except Exception as e:
        print(f"❌ SSH error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
