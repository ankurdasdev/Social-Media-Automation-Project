#!/usr/bin/env python3
"""
SSH tunnel to Hetzner PostgreSQL using paramiko (no sshpass needed).
Run this in a separate terminal before starting pnpm dev.

For local dev, set in .env:
  DATABASE_URL=postgresql://postgres:b5e9209b350e6a97f7d6@localhost:5433/SocialOutreach
"""
import paramiko
import socket
import threading
import sys
import time

# ── Config ────────────────────────────────────────────────────────────────────
VPS_IP = "46.62.144.244"
VPS_USER = "chandan"
VPS_PASSWORD = "Ch@ndan@2025"
# Connect to the socat proxy listening on VPS host's localhost:15432
REMOTE_HOST = "127.0.0.1"
REMOTE_PORT = 15432
LOCAL_PORT = 5433


def forward_handler(local_sock, transport):
    """Forward one local connection to the remote host via SSH transport."""
    try:
        remote_chan = transport.open_channel(
            "direct-tcpip",
            (REMOTE_HOST, REMOTE_PORT),
            local_sock.getpeername()
        )
    except Exception as e:
        print(f"  Tunnel channel error: {e}")
        local_sock.close()
        return

    def pipe(src, dst):
        try:
            while True:
                data = src.recv(4096)
                if not data:
                    break
                dst.send(data)
        except Exception:
            pass
        finally:
            try: src.close()
            except: pass
            try: dst.close()
            except: pass

    t1 = threading.Thread(target=pipe, args=(local_sock, remote_chan), daemon=True)
    t2 = threading.Thread(target=pipe, args=(remote_chan, local_sock), daemon=True)
    t1.start()
    t2.start()


def main():
    print(f"🔗 Connecting to {VPS_USER}@{VPS_IP} ...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(VPS_IP, username=VPS_USER, password=VPS_PASSWORD, timeout=10)
    except Exception as e:
        print(f"❌ SSH connection failed: {e}")
        sys.exit(1)

    transport = client.get_transport()
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("127.0.0.1", LOCAL_PORT))
    server.listen(5)

    print(f"✅ SSH tunnel open: localhost:{LOCAL_PORT} → {REMOTE_HOST}:{REMOTE_PORT}")
    print(f"   DATABASE_URL=postgresql://postgres:b5e9209b350e6a97f7d6@localhost:{LOCAL_PORT}/SocialOutreach")
    print("   Press Ctrl+C to stop.\n")

    try:
        while True:
            try:
                local_sock, addr = server.accept()
                t = threading.Thread(target=forward_handler, args=(local_sock, transport), daemon=True)
                t.start()
            except KeyboardInterrupt:
                break
    finally:
        server.close()
        client.close()
        print("\n🛑 Tunnel closed.")


if __name__ == "__main__":
    main()
