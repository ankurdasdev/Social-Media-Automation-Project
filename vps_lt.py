#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')
import paramiko
import time

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("Kill existing tunnels", "pkill -f localtunnel || true"),
    ("Start localtunnel to port 8000", "nohup npm install -g localtunnel && nohup lt --port 8000 --subdomain casthub-insta > /home/chandan/lt.log 2>&1 &"),
    ("Wait", "sleep 6"),
    ("Get URL", "cat /home/chandan/lt.log"),
]

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
        for label, cmd in COMMANDS:
             # handle sudo if needed
            if "npm install -g" in cmd:
                cmd = f"echo '{PASSWORD}' | sudo -S sh -c 'npm install -g localtunnel && nohup lt --port 8000 --subdomain casthub-insta > /home/chandan/lt.log 2>&1 &'"
                
            stdin, stdout, stderr = client.exec_command(cmd)
            time.sleep(1) # give nohup a moment to detach
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            print(f"\n### {label}\n{out or err or '(no output)'}")
    except Exception as e:
        print(f"❌ SSH error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
