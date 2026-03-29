#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("Install cloudflared", "curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb"),
    ("Run Cloudflare quick tunnel", "nohup cloudflared tunnel --url http://localhost:8000 > cloudflared.log 2>&1 &"),
    ("Wait 5s", "sleep 5"),
    ("Get tunnel URL", "grep 'trycloudflare.com' cloudflared.log | head -1 | awk '{print $4}' | grep trycloudflare"),
]

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
        for label, cmd in COMMANDS:
             # run with sudo requires pty to pass password nicely, but we can use echo pwd | sudo -S
            if "sudo" in cmd:
                cmd = f"echo '{PASSWORD}' | {cmd.replace('sudo ', 'sudo -S ')}"
            
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
