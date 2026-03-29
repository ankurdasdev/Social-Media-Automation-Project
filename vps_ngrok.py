#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko
import time

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("Download Ngrok", "curl -sL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -o ngrok.tgz && tar -xzf ngrok.tgz"),
    ("Kill old ngrok", "pkill ngrok || true"),
    # Start ngrok in background without auth token (will give an ephemeral URL)
    ("Start ngrok", "nohup ./ngrok http 8000 > /dev/null 2>&1 &"),
    ("Wait", "sleep 3"),
    ("Get Ngrok URL", "curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^/\" ]*\\.ngrok-free\\.app' | head -1"),
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
            print(f"\n### {label}\n{out or err or '(no output)'}")
    except Exception as e:
        print(f"❌ SSH error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
