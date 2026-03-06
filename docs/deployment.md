# Production Deployment Guide

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Server Setup](#2-server-setup)
3. [Repository & Environment](#3-repository--environment)
4. [Build & Deploy with Docker Compose](#4-build--deploy-with-docker-compose)
5. [Database Migrations](#5-database-migrations)
6. [Nginx Reverse Proxy + SSL](#6-nginx-reverse-proxy--ssl)
7. [Keeping the App Running](#7-keeping-the-app-running)
8. [Health Checks & Monitoring](#8-health-checks--monitoring)
9. [Backups](#9-backups)
10. [Updating / Rolling Deployments](#10-updating--rolling-deployments)
11. [Environment Variable Reference](#11-environment-variable-reference)

---

## 1. Prerequisites

| Requirement | Min version | Notes |
|-------------|-------------|-------|
| Ubuntu / Debian | 22.04 LTS | Recommended |
| Docker Engine | 24+ | [Install guide](https://docs.docker.com/engine/install/ubuntu/) |
| Docker Compose V2 | 2.20+ | Included with Docker Engine |
| Nginx | 1.24+ | Reverse proxy + SSL termination |
| Certbot | latest | Let's Encrypt SSL certificates |
| Domain name | — | A record pointing to server IP |

> **No Node.js or pnpm required on the server.** The application runs entirely inside Docker.

---

## 2. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create app directory
sudo mkdir -p /opt/unibooking
sudo chown $USER:$USER /opt/unibooking
```

---

## 3. Repository & Environment

### 3.1 Clone the repository

```bash
cd /opt/unibooking
git clone <your-repo-url> .
```

### 3.2 Create the environment file

```bash
cp apps/backend/.env.example .env
nano .env
```

Fill in **all** values. Pay special attention to:

| Variable | Production requirement |
|----------|----------------------|
| `NODE_ENV` | Must be `production` |
| `JWT_SECRET` | Min 32 random characters — generate with `openssl rand -hex 32` |
| `AES_SECRET_KEY` | Exactly 32 characters — generate with `openssl rand -hex 16` |
| `DB_PASSWORD` | Strong password, no special shell characters |
| `REDIS_PASSWORD` | Strong password |
| `MYSQL_ROOT_PASSWORD` | Strong password |
| `MAYAR_WEBHOOK_SECRET` | Copy from your Mayar.id dashboard |
| `APP_URL` | Your backend domain e.g. `https://api.yourdomain.com` |
| `FRONTEND_URL` | Your frontend domain e.g. `https://yourdomain.com` |
| `SMTP_*` | Transactional email provider credentials |

> **Security:** The `.env` file contains secrets. Never commit it to git.
> Restrict its permissions: `chmod 600 .env`

### 3.3 Generate secure secrets

```bash
# JWT secret (64 hex chars)
echo "JWT_SECRET=$(openssl rand -hex 32)"

# AES key (exactly 32 chars)
echo "AES_SECRET_KEY=$(openssl rand -hex 16)"

# Passwords
echo "DB_PASSWORD=$(openssl rand -base64 20 | tr -d '/+=' | head -c 20)"
echo "REDIS_PASSWORD=$(openssl rand -base64 20 | tr -d '/+=' | head -c 20)"
echo "MYSQL_ROOT_PASSWORD=$(openssl rand -base64 20 | tr -d '/+=' | head -c 20)"
```

---

## 4. Build & Deploy with Docker Compose

The main `docker-compose.yml` is production-ready:
- MySQL and Redis are **not** exposed to the host (internal Docker network only).
- Only the backend port (`3000`) is exposed (Nginx will terminate SSL in front of it).

```bash
# Build the backend image (context is monorepo root — includes pnpm-lock.yaml)
docker compose build backend

# Start everything
docker compose up -d

# Verify all containers are healthy
docker compose ps
```

Expected output:
```
NAME                  IMAGE            STATUS
unibooking-mysql-1    mysql:8.0        Up (healthy)
unibooking-redis-1    redis:7-alpine   Up (healthy)
unibooking-backend-1  unibooking...    Up
```

---

## 5. Database Migrations

Migrations must be run **once after first deploy** and **after every deploy that includes new migration files**.

```bash
# Run migrations using the compiled dist (production)
docker compose exec backend node dist/db/migrate.js
```

The runner is idempotent — already-executed migrations are skipped, so it is safe to run on every deploy.

### Automate migrations on deploy

Add to your deploy script:

```bash
docker compose pull          # or build
docker compose up -d
docker compose exec backend node dist/db/migrate.js
```

---

## 6. Nginx Reverse Proxy + SSL

### 6.1 Create the Nginx site config

```bash
sudo nano /etc/nginx/sites-available/unibooking
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Proxy to backend container
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Larger body limit for file uploads if needed
    client_max_body_size 10m;
}
```

### 6.2 Enable and obtain SSL certificate

```bash
sudo ln -s /etc/nginx/sites-available/unibooking /etc/nginx/sites-enabled/

sudo nginx -t   # validate config
sudo systemctl reload nginx

# Obtain Let's Encrypt certificate
sudo certbot --nginx -d api.yourdomain.com

sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Keeping the App Running

Docker Compose containers have `restart: unless-stopped` in the compose file, so they survive reboots automatically once started.

Enable Docker to start on boot:

```bash
sudo systemctl enable docker
```

Verify containers start after a reboot:

```bash
sudo reboot
# After reconnecting:
docker compose -f /opt/unibooking/docker-compose.yml ps
```

---

## 8. Health Checks & Monitoring

### Built-in health endpoint

```bash
curl https://api.yourdomain.com/health
# {"status":"ok","timestamp":"..."}
```

### Container health

```bash
docker compose ps          # see container health status
docker compose logs -f     # follow all logs
docker compose logs backend -f   # backend only
```

### Log rotation

Docker JSON log driver rotates logs. Configure limits in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```

```bash
sudo systemctl restart docker
```

### Recommended: uptime monitoring

Point an external service (UptimeRobot, Better Uptime, etc.) at `https://api.yourdomain.com/health` with a 1-minute interval.

---

## 9. Backups

### Automated MySQL backup script

```bash
sudo nano /opt/backup-mysql.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups/mysql
mkdir -p "$BACKUP_DIR"

docker compose -f /opt/unibooking/docker-compose.yml exec -T mysql \
  mysqldump -uroot -p"${MYSQL_ROOT_PASSWORD}" unibooking \
  | gzip > "$BACKUP_DIR/unibooking_${TIMESTAMP}.sql.gz"

# Keep last 14 days only
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete

echo "Backup done: unibooking_${TIMESTAMP}.sql.gz"
```

```bash
sudo chmod +x /opt/backup-mysql.sh

# Schedule daily at 2am
(crontab -l 2>/dev/null; echo "0 2 * * * MYSQL_ROOT_PASSWORD=yourpw /opt/backup-mysql.sh >> /var/log/mysql-backup.log 2>&1") | crontab -
```

### Restore from backup

```bash
gunzip -c /opt/backups/mysql/unibooking_TIMESTAMP.sql.gz \
  | docker compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" unibooking
```

---

## 10. Updating / Rolling Deployments

```bash
cd /opt/unibooking

# Pull latest code
git pull origin main

# Rebuild backend image
docker compose build backend

# Replace the running container (brief downtime ~2-3s)
docker compose up -d --no-deps backend

# Run any new migrations
docker compose exec backend node dist/db/migrate.js

# Verify health
curl https://api.yourdomain.com/health
```

For zero-downtime deploys with multiple backend instances, use a load balancer and `docker compose scale` — outside MVP scope.

---

## 11. Environment Variable Reference

All variables go in `/opt/unibooking/.env` (root of the repo on the server).

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | Yes | `production` | |
| `PORT` | No | `3000` | Default 3000 |
| `DB_HOST` | Yes | `mysql` | Docker service name in compose |
| `DB_PORT` | Yes | `3306` | Internal Docker port |
| `DB_USER` | Yes | `unibooking` | |
| `DB_PASSWORD` | Yes | *(strong password)* | |
| `DB_NAME` | Yes | `unibooking` | |
| `REDIS_HOST` | Yes | `redis` | Docker service name |
| `REDIS_PORT` | Yes | `6379` | Internal Docker port |
| `REDIS_PASSWORD` | Yes | *(strong password)* | |
| `JWT_SECRET` | Yes | *(64 hex chars)* | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | No | `7d` | |
| `JWT_CUSTOMER_EXPIRES_IN` | No | `24h` | |
| `AES_SECRET_KEY` | Yes | *(32 chars)* | `openssl rand -hex 16` |
| `SMTP_HOST` | Yes | `smtp.sendgrid.net` | |
| `SMTP_PORT` | Yes | `587` | |
| `SMTP_USER` | Yes | `apikey` | SendGrid uses `apikey` as username |
| `SMTP_PASS` | Yes | *(SMTP password)* | |
| `SMTP_FROM` | Yes | `"Unibooking <noreply@yourdomain.com>"` | |
| `APP_URL` | Yes | `https://api.yourdomain.com` | Backend public URL |
| `FRONTEND_URL` | Yes | `https://yourdomain.com` | Used for CORS + magic links |
| `MAYAR_WEBHOOK_SECRET` | Yes | *(from Mayar dashboard)* | HMAC signature verification |
| `MYSQL_ROOT_PASSWORD` | Yes | *(strong password)* | Docker compose only |

---

## Local Development Notes

To run locally with Docker (recommended to avoid port conflicts with existing local MySQL/Redis):

```bash
# Start only infra with host port mappings
docker compose -f docker-compose.yml -f docker-compose.dev.yml up mysql redis -d

# Run backend directly with ts-node-dev
pnpm --filter backend run migrate
pnpm --filter backend run dev
```

Default dev ports (override in `.env` via `DEV_MYSQL_PORT` / `DEV_REDIS_PORT`):
- MySQL: `localhost:3307`
- Redis: `localhost:6380`
