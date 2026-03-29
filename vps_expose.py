#!/usr/bin/env python3
"""
Investigating how to expose port 8000 safely.
The VPS seems to run Traefik (saw traefik:3.3.7 running).
Let's check if there are routing files we can tap into, or just use ufw/iptables to open the port.
"""
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("IPtables rules for 8000", "sudo iptables -L -n | grep 8000 || echo 'no iptables block'"),
    ("Docker network inspect", "docker inspect instagrapi-rest-api-1 | grep -i networkmode"),
    ("Traefik config check", "docker ps | grep traefik"),
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
