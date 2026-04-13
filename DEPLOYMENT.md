# Deployment Guide

## Quick Deployment Options

This ATS application can be deployed to several platforms. Choose based on your preference:

### 1. **Vercel** (Recommended - Easiest)

Vercel is made by the Next.js creators and offers seamless deployment.

#### Prerequisites
- GitHub account with repository
- Vercel account (free tier available)

#### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select root directory: `/`
   - Click "Deploy"

3. **Vercel Auto-Configuration**
   - Detects it's a Next.js app
   - Installs dependencies
   - Builds and deploys automatically
   - Provides public URL (https://ats-xxx.vercel.app)

4. **Monitor Deployment**
   - Check "Deployments" tab for status
   - View build logs if needed
   - Update settings in Project Settings

#### Environment Variables
For this app, no environment variables are required (stateless).

#### Custom Domain
In Vercel dashboard:
- Go to Settings > Domains
- Add your domain
- Follow DNS instructions

### 2. **Netlify**

Similar to Vercel, but with different UI.

#### Steps
1. Connect GitHub repository at https://app.netlify.com
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Deploy
4. Netlify provides URL automatically

#### Limitations
- Requires Build Plugin for Next.js
- May need additional configuration

### 3. **Docker + Cloud Run (Google Cloud)**

For containerized deployment on Google Cloud.

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Create .dockerignore
```
node_modules
.next
.git
.env.local
```

#### Deploy Steps
```bash
# Authenticate with Google Cloud
gcloud auth login

# Create Cloud Run deployment
gcloud run deploy ats \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 4. **AWS EC2**

For more control over infrastructure.

#### Steps

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.micro (free tier eligible)
   - Allow HTTP (80) and HTTPS (443)
   - Create key pair for SSH

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/ats.git
   cd ats
   npm install
   npm run build
   ```

5. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "ats" -- start
   pm2 startup
   pm2 save
   ```

6. **Install Nginx (Reverse Proxy)**
   ```bash
   sudo apt-get install nginx
   ```

   **Edit `/etc/nginx/sites-available/default`:**
   ```nginx
   server {
       listen 80 default_server;
       server_name _;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

   ```bash
   sudo systemctl restart nginx
   ```

7. **SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### 5. **DigitalOcean App Platform**

Simpler than EC2, more control than Vercel.

#### Steps
1. Go to https://cloud.digitalocean.com/
2. Click "Create" → "App"
3. Connect GitHub repository
4. Auto-detect Next.js settings
5. Deploy
6. Assign domain

### 6. **Heroku** (Deprecated)

Heroku is sunsetting the free tier. Consider alternatives above.

## Post-Deployment

### 1. **SSL/HTTPS**
- Vercel: Automatic (built-in)
- Netlify: Automatic (built-in)
- AWS/DigitalOcean: Use Let's Encrypt

### 2. **Custom Domain**
- Add domain in platform settings
- Update DNS records
- Wait for propagation (5-60 minutes)

### 3. **Environment Variables**
For this app: None required for basic functionality

If adding database later:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
API_KEY=your-api-key
```

### 4. **Monitoring & Logging**

**Vercel**
- Automatic logging in dashboard
- Real-time monitoring
- Error tracking with Sentry integration

**AWS CloudWatch**
```bash
# View logs
aws logs tail /aws/lambda/ats-function

# Set up alerts
# In AWS Console: CloudWatch > Alarms
```

**Manual Logging**
- SSH into server
- `pm2 logs` to view application logs
- Check nginx logs: `/var/log/nginx/error.log`

### 5. **Performance Optimization**

#### Enable Caching Headers
In `next.config.ts`:
```typescript
export default {
  headers: async () => {
    return [
      {
        source: '/api/process-resumes',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' }
        ]
      }
    ]
  }
}
```

#### Use CDN
- Vercel: Automatic global CDN
- AWS: CloudFront
- DigitalOcean: Spaces + CDN

### 6. **Database Integration** (Optional Future)

If you want to add database:

```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
```

Store results in database instead of in-memory:
- Keep processing in-memory
- Store results for later retrieval
- Build applicant tracking pipeline

## Cost Estimates

| Platform | Cost | Best For |
|----------|------|----------|
| Vercel (free) | $0-$20/month | Small usage, open source |
| AWS Lambda | $0.20 per 1M requests | Pay-per-use, scalable |
| DigitalOcean | $6-$24/month | Small projects, control |
| EC2 (free tier) | $0-$10/month | Learning, control |
| Netlify | $0-$20/month | Jamstack, static assets |

## Troubleshooting Deployment

### "Build fails"
1. Check Node version: `node -v` (should be 18+)
2. Check dependencies: `npm list` (look for conflicts)
3. Review build logs in platform dashboard
4. Try building locally: `npm run build`

### "App crashes on startup"
1. Check logs: `pm2 logs` (EC2) or platform logs
2. Verify environment variables are set
3. Check Node.js version
4. Ensure port 3000 is available

### "Slow performance"
1. Enable caching headers
2. Add CDN
3. Optimize PDF extraction
4. Consider worker threads for batch processing

### "Out of memory"
1. Increase server RAM (scale up)
2. Process resumes in smaller batches
3. Implement worker threads
4. Add queue system

### "PDF extraction not working"
1. Verify pdf-parse can import pdfjs-dist
2. Check PDF file formats (should be standard PDFs)
3. Add more debugging in logs
4. Test with different PDFs

## Continuous Deployment

### GitHub Actions (Auto-deploy on push)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      
      # Deploy to Vercel
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

Setup:
1. Get tokens from Vercel dashboard
2. Add as GitHub secrets
3. Commit and push
4. Auto-deploys on each push

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables not in code
- [ ] Dependencies updated (`npm audit fix`)
- [ ] No database credentials in logs
- [ ] API rate limiting configured (if needed)
- [ ] CORS properly configured (if needed)
- [ ] File upload size limits
- [ ] Error messages don't leak info

## Backup & Recovery

Since this is stateless:
- No database to backup
- Results exist only in session
- Users must export CSV after processing

If adding database:
1. Automated backups (daily)
2. Point-in-time recovery
3. Test restore process monthly

## Scaling Strategy

### Phase 1: Start (Current)
- Serverless (Vercel/Netlify)
- In-memory processing
- No persistence

### Phase 2: Growth
- Add PostgreSQL database
- Store batch results
- User authentication

### Phase 3: Scale
- Worker threads for PDFs
- Redis for caching
- Job queue system (Bull, RabbitMQ)

### Phase 4: Enterprise
- Multi-region deployment
- Database replication
- Advanced analytics
- Team collaboration features

---

**Choose the option that best fits your needs and experience level. Start with Vercel for easiest deployment!**
