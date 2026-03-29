#!/usr/bin/env python3
"""
Read-only VPS diagnostics via paramiko SSH.
Checks: OS, Python, Docker, disk space, memory, running services, open ports.
"""
import sys
sys.path.insert(0, '/Users/ankur/Library/Python/3.9/lib/python/site-packages')

import paramiko

HOST = "46.62.144.244"
USER = "chandan"
PASSWORD = "Ch@ndan@2025"

COMMANDS = [
    ("OS version",          "cat /etc/os-release | grep PRETTY_NAME"),
    ("Kernel",              "uname -r"),
    ("Current user",        "whoami && id"),
    ("Disk space",          "df -h /"),
    ("Memory",              "free -h"),
    ("Python3 version",     "python3 --version 2>&1 || echo 'python3 not found'"),
    ("pip3 version",        "pip3 --version 2>&1 || echo 'pip3 not found'"),
    ("Docker version",      "docker --version 2>&1 || echo 'docker not installed'"),
    ("Docker running",      "systemctl is-active docker 2>&1 || echo 'systemd n/a'"),
    ("Running services",    "systemctl list-units --type=service --state=running --no-pager 2>/dev/null | head -20 || ps aux | grep -v grep | grep -E 'python|node|nginx|apache|docker' | head -10"),
    ("Port 8000 in use",    "ss -tlnp | grep 8000 || echo 'port 8000 free'"),
    ("Port 8080 in use",    "ss -tlnp | grep 8080 || echo 'port 8080 free'"),
    ("UFW status",          "sudo ufw status 2>&1 || echo 'ufw not available'"),
    ("Home dir contents",   "ls -la /home/chandan/"),
    ("Sudo access",         "sudo -n uptime 2>&1 || echo 'sudo requires password'"),
]

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {HOST}...")
        client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
        print(f"✅ Connected as {USER}\n")
        print("=" * 60)
        
        for label, cmd in COMMANDS:
            stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            result = out or err or "(no output)"
            print(f"\n### {label}")
            print(f"$ {cmd}")
            print(result)
        
        print("\n" + "=" * 60)
        print("✅ Diagnostics complete.")
    except Exception as e:
        print(f"❌ SSH error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
