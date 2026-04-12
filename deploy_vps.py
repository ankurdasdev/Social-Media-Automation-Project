#!/usr/bin/env python3
import paramiko
import sys
import os

VPS_IP = "46.62.144.244"
VPS_USER = "chandan"
VPS_PASSWORD = "Ch@ndan@2025"
LOCAL_ARCHIVE = "/tmp/casthub_deploy.tar.gz"
REMOTE_ARCHIVE = "/home/chandan/casthub_deploy.tar.gz"
REMOTE_DIR = "/home/chandan/casthub"

def run_cmd(ssh, cmd):
    print(f"➜ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for the command to finish
    exit_status = stdout.channel.recv_exit_status()
    
    # Read output
    out = stdout.read().decode('utf-8').strip()
    err = stderr.read().decode('utf-8').strip()
    
    if out:
        for line in out.split('\n'):
            print(f"  | {line}")
    if err:
        for line in err.split('\n'):
            print(f"  | [ERR] {line}")
            
    if exit_status != 0:
        print(f"❌ Command failed with status {exit_status}")
    else:
        print("✅ Success")
    return exit_status

def main():
    if not os.path.exists(LOCAL_ARCHIVE):
        print("Archive not found!")
        sys.exit(1)

    print(f"🔗 Connecting to {VPS_USER}@{VPS_IP}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASSWORD)

    print("📦 Uploading archive and env...")
    sftp = ssh.open_sftp()
    sftp.put(LOCAL_ARCHIVE, REMOTE_ARCHIVE)
    sftp.put(".env.production", "/home/chandan/.env")
    sftp.close()
    
    print("🚀 Running deployment commands...")
    
    commands = [
        # Setup Node.js 20 if not installed
        f"echo {VPS_PASSWORD} | sudo -S bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -'",
        f"echo {VPS_PASSWORD} | sudo -S apt-get install -y nodejs nginx",
        f"echo {VPS_PASSWORD} | sudo -S npm install -g pnpm pm2",
        
        # Prepare directory
        f"mkdir -p {REMOTE_DIR}",
        f"tar -xzf {REMOTE_ARCHIVE} -C {REMOTE_DIR}",
        f"mv /home/chandan/.env {REMOTE_DIR}/.env",
        
        # Build and start
        f"cd {REMOTE_DIR} && source ~/.profile && pnpm install --frozen-lockfile=false",
        f"cd {REMOTE_DIR} && source ~/.profile && pnpm run build",
        f"cd {REMOTE_DIR} && source ~/.profile && pm2 reload casthub || pm2 start ecosystem.config.cjs",
        f"source ~/.profile && pm2 save"
    ]
    
    for cmd in commands:
        if run_cmd(ssh, cmd) != 0 and "kill" not in cmd:
            pass # Keep going

    # Let's write the nginx config
    nginx_conf = """server {
    listen 80;
    server_name 46.62.144.244;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}"""
    print("⚙️ Configuring Nginx...")
    sftp = ssh.open_sftp()
    with sftp.file('/home/chandan/casthub_nginx', 'w') as f:
        f.write(nginx_conf)
    sftp.close()

    run_cmd(ssh, f"echo {VPS_PASSWORD} | sudo -S mv /home/chandan/casthub_nginx /etc/nginx/sites-available/casthub")
    run_cmd(ssh, f"echo {VPS_PASSWORD} | sudo -S ln -sf /etc/nginx/sites-available/casthub /etc/nginx/sites-enabled/")
    run_cmd(ssh, f"echo {VPS_PASSWORD} | sudo -S rm -f /etc/nginx/sites-enabled/default")
    run_cmd(ssh, f"echo {VPS_PASSWORD} | sudo -S systemctl restart nginx")

    print("\n🎉 Deployment completed! The app should be live on http://46.62.144.244")
    ssh.close()

if __name__ == "__main__":
    main()
