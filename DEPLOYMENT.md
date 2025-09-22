# Railway QR Generator - Deployment Guide

This guide provides multiple options for deploying your Railway QR Generator application to production servers.

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed on your server
- Port 3000 and 5000 available

#### Quick Start
```bash
# Clone or upload your project to the server
git clone <your-repo> railway-qr-generator
cd railway-qr-generator

# Build and start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs
```

#### Manual Docker Build
```bash
# Build the image
docker build -f Dockerfile.production -t railway-qr-generator .

# Run the container
docker run -d \
  --name railway-qr-generator \
  -p 3000:3000 \
  -p 5000:5000 \
  -v qr_data:/app/data \
  railway-qr-generator
```

### Option 2: Cloud Platform Deployments

#### 2.1 Vercel (Frontend Only)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
vercel --prod

# Note: You'll need to deploy the backend separately
```

#### 2.2 Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### 2.3 DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
3. Add environment variables
4. Deploy

#### 2.4 AWS EC2
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Clone your project
git clone <your-repo> railway-qr-generator
cd railway-qr-generator

# Deploy with Docker Compose
sudo docker-compose up -d
```

#### 2.5 Google Cloud Run
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/railway-qr-generator

# Deploy to Cloud Run
gcloud run deploy --image gcr.io/PROJECT-ID/railway-qr-generator --platform managed
```

### Option 3: VPS/Dedicated Server

#### Traditional Setup (Ubuntu/Debian)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt install python3 python3-pip python3-venv

# Install PM2 for process management
sudo npm install -g pm2

# Clone your project
git clone <your-repo> railway-qr-generator
cd railway-qr-generator

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install Node.js dependencies and build
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 🔧 Configuration

### Environment Variables
Create appropriate `.env` files for your deployment:

**Production (.env.production):**
```env
FLASK_ENV=production
NODE_ENV=production
DATABASE_PATH=/app/data/qr_records.db
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔐 Security Considerations

1. **SSL/TLS**: Use HTTPS in production
2. **Firewall**: Only open necessary ports (80, 443, 22)
3. **Database**: Backup your SQLite database regularly
4. **Updates**: Keep your system and dependencies updated

## 📊 Monitoring

### Health Checks
- Frontend: `http://yourdomain.com`
- Backend: `http://yourdomain.com/api/get_current_count`

### Log Monitoring
```bash
# Docker logs
docker-compose logs -f

# PM2 logs
pm2 logs

# System logs
sudo journalctl -u your-service -f
```

## 🔄 Backup Strategy

```bash
# Backup database
docker exec railway-qr-generator python db_manager.py backup

# Copy backup file
docker cp railway-qr-generator:/app/database_backup.json ./backup/
```

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in docker-compose.yml
2. **Permission issues**: Check file permissions and user ownership
3. **Database errors**: Verify database path and permissions
4. **API connection**: Check NEXT_PUBLIC_API_URL configuration

### Support Commands
```bash
# Check Docker status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Post-Deployment Checklist

- [ ] Application accessible via web browser
- [ ] QR code generation works
- [ ] History functionality works
- [ ] Database persistence verified
- [ ] SSL certificate configured (if applicable)
- [ ] Monitoring and alerting set up
- [ ] Backup strategy implemented
- [ ] Documentation updated with actual domain/IP

Choose the deployment option that best fits your infrastructure and requirements!