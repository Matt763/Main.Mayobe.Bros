# Spaceship Hosting Deployment Guide

## Complete Step-by-Step Instructions

### Part 1: Running Locally (Development)

#### Step 1: Install Node.js (If Not Already Installed)
1. Go to https://nodejs.org/
2. Download the LTS version (recommended)
3. Install Node.js
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Step 2: Install Project Dependencies
Open terminal/command prompt in your project folder:
```bash
npm install
```

This installs all required packages (Express, React, etc.)

#### Step 3: Start the Development Server
```bash
npm run dev
```

**What this does:**
- Starts backend API server on `http://localhost:3001`
- Starts frontend website on `http://localhost:5173`
- Both run simultaneously

#### Step 4: Access Your Website Locally
- **Public Site:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin/login
- **Login with:**
  - Email: `mbagamclean@gmail.com`
  - Password: `mambo dagas`

#### Step 5: Test Everything Works
1. Login to admin panel
2. Try creating a test post
3. Upload a test image
4. View the post on the public site
5. If everything works, you're ready to deploy!

---

### Part 2: Deploying to Spaceship Hosting

#### Prerequisites
Before deploying, ensure Spaceship supports:
- ✅ Node.js applications (version 18 or higher)
- ✅ File system access
- ✅ Running custom Node.js servers
- ✅ Environment variables (optional)

#### Deployment Steps

### Option A: Full Application Deployment (Recommended)

#### Step 1: Build the Production Version
In your project folder:
```bash
npm run build
```

This creates an optimized version in the `/dist` folder.

#### Step 2: Prepare Production Server File
Create a file named `production-server.js` in your project root:

```javascript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './server/routes/auth.js';
import postsRoutes from './server/routes/posts.js';
import pagesRoutes from './server/routes/pages.js';
import categoriesRoutes from './server/routes/categories.js';
import labelsRoutes from './server/routes/labels.js';
import imagesRoutes from './server/routes/images.js';
import settingsRoutes from './server/routes/settings.js';
import commentsRoutes from './server/routes/comments.js';
import reviewsRoutes from './server/routes/reviews.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://www.mayobebros.com',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mayobebros-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Serve uploaded images
app.use('/data/images', express.static(path.join(__dirname, 'data/images')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/labels', labelsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/reviews', reviewsRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - send all non-API requests to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mayobe Bros running on port ${PORT}`);
});
```

#### Step 3: Update package.json Scripts
Add this script to your `package.json`:

```json
{
  "scripts": {
    "start": "node production-server.js",
    "dev": "concurrently \"npm run server\" \"vite\"",
    "server": "tsx server/index.ts",
    "build": "vite build"
  }
}
```

#### Step 4: Upload to Spaceship Hosting

**Upload these files/folders:**
```
✅ /server                    (Backend API code)
✅ /dist                      (Built frontend)
✅ /data                      (All your content!)
✅ /node_modules              (Dependencies) OR run npm install on server
✅ production-server.js       (Production server)
✅ package.json               (Dependencies list)
✅ package-lock.json          (Dependency versions)
```

**Via FTP/SFTP:**
1. Connect to your Spaceship hosting via FTP
2. Upload all files to your web root directory
3. Make sure file permissions are correct (755 for folders, 644 for files)

**Via SSH (if available):**
```bash
# On your local machine, zip the project
zip -r mayobebros.zip . -x "node_modules/*" -x ".git/*"

# Upload to server
scp mayobebros.zip user@yourserver.com:/path/to/webroot/

# On the server, unzip
cd /path/to/webroot/
unzip mayobebros.zip

# Install dependencies
npm install --production
```

#### Step 5: Start the Application on Spaceship

**If Spaceship uses Process Manager (PM2):**
```bash
pm2 start production-server.js --name mayobebros
pm2 save
```

**If Spaceship uses systemd service:**
Create a service file (contact Spaceship support for the exact path):
```ini
[Unit]
Description=Mayobe Bros Website
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node production-server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl start mayobebros
sudo systemctl enable mayobebros
```

**If Spaceship uses a control panel:**
1. Look for "Node.js Application" settings
2. Set entry point to `production-server.js`
3. Click "Start Application"

#### Step 6: Configure Domain
In Spaceship control panel:
1. Point your domain `www.mayobebros.com` to your server
2. If using a subdomain or proxy, configure it to forward to port 3000

#### Step 7: Test Your Live Site
1. Visit https://www.mayobebros.com
2. Navigate to https://www.mayobebros.com/admin/login
3. Login with your credentials
4. Test creating a post
5. Verify images upload correctly

---

### Option B: Static Site + Separate API Server

If Spaceship has limitations, you can deploy as two separate services:

**Part 1: Deploy Frontend as Static Site**
1. Run `npm run build`
2. Upload only the `/dist` folder
3. Configure as static HTML site

**Part 2: Deploy Backend API Separately**
1. Deploy `/server` folder and `/data` folder to a Node.js host
2. Update API_BASE_URL in frontend to point to API server
3. Configure CORS to allow your frontend domain

---

### Part 3: Post-Deployment Configuration

#### Update API URLs in Production
If your API is on a different URL, update `/src/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mayobebros.com/api'  // Your production API URL
  : '/api';  // Local development
```

Then rebuild: `npm run build`

#### Environment Variables (Recommended)
Create a `.env.production` file:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://www.mayobebros.com
SESSION_SECRET=your-very-secure-random-string-here
```

**Generate secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Secure Your Installation

1. **Change Default Password**
   Edit `/data/auth/users.json`:
   ```json
   [
     {
       "id": "1",
       "email": "mbagamclean@gmail.com",
       "password": "YOUR-NEW-SECURE-PASSWORD",
       "role": "admin",
       "createdAt": "2026-02-11T00:00:00.000Z"
     }
   ]
   ```

2. **Set File Permissions** (Linux/Unix)
   ```bash
   chmod 700 data/
   chmod 600 data/auth/users.json
   ```

3. **Enable HTTPS**
   - Configure SSL certificate in Spaceship
   - Most hosting provides free Let's Encrypt SSL

4. **Regular Backups**
   ```bash
   # Automated backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d-%H%M%S)
   tar -czf backup-$DATE.tar.gz data/
   ```

---

### Part 4: Troubleshooting

#### Website Not Loading
- Check if Node.js process is running: `pm2 status` or `ps aux | grep node`
- Check server logs for errors
- Verify port 3000 is accessible
- Check firewall settings

#### API Errors (500/404)
- Check `/data` folder exists and has correct permissions
- Verify all JSON files are valid (use JSONLint.com)
- Check server logs: `pm2 logs mayobebros`

#### Login Not Working
- Verify `/data/auth/users.json` exists
- Check credentials match exactly (case-sensitive)
- Clear browser cookies and try again
- Check session configuration in production-server.js

#### Images Not Displaying
- Verify `/data/images/` folder exists
- Check file permissions: `chmod 755 data/images/`
- Ensure images are referenced with correct paths
- Check browser console for 404 errors

#### Posts Not Appearing
- Check files exist in `/data/posts/`
- Verify JSON syntax is valid
- Check post status is "published"
- Restart server: `pm2 restart mayobebros`

---

### Part 5: Ongoing Maintenance

#### Backup Your Data
**Daily automatic backup script:**
```bash
#!/bin/bash
# backup.sh
cd /path/to/your/app
tar -czf ../backups/data-$(date +%Y%m%d).tar.gz data/
# Keep only last 30 days
find ../backups/ -name "data-*.tar.gz" -mtime +30 -delete
```

Add to crontab:
```bash
crontab -e
# Add this line:
0 2 * * * /path/to/backup.sh
```

#### Download Backups Regularly
```bash
# From your local machine
scp user@yourserver.com:/path/to/backups/data-*.tar.gz ./local-backups/
```

#### Update Content
1. Login to admin panel at https://www.mayobebros.com/admin/login
2. All changes automatically save to `/data` folder
3. No rebuild or restart needed!

#### Update the Application
When you make code changes:
```bash
# Local
npm run build

# Upload new /dist folder and new server files
# Restart application
pm2 restart mayobebros
```

---

### Part 6: Performance Optimization

#### Enable Gzip Compression
Add to production-server.js:
```javascript
import compression from 'compression';
app.use(compression());
```

Then: `npm install compression`

#### Add Caching Headers
```javascript
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true
}));
```

#### Use a Reverse Proxy (Nginx)
If Spaceship supports Nginx:
```nginx
server {
    listen 80;
    server_name www.mayobebros.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /data/images/ {
        alias /path/to/app/data/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### Part 7: Contact Spaceship Support

**Questions to ask Spaceship Support:**

1. "Do you support Node.js applications? What version?"
2. "How do I deploy a Node.js Express application?"
3. "Can I run a custom Node.js server (not just static files)?"
4. "How do I configure the entry point for my Node.js app?"
5. "Do you provide PM2 or another process manager?"
6. "How do I access SSH to install dependencies?"
7. "How do I configure environment variables?"
8. "What's the recommended way to keep the Node.js process running?"
9. "Do you provide automatic SSL certificates?"
10. "How do I access application logs?"

---

### Quick Reference Commands

**Local Development:**
```bash
npm install           # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

**Production:**
```bash
npm install --production   # Install only production dependencies
npm start                  # Start production server
pm2 start production-server.js --name mayobebros  # Start with PM2
pm2 logs mayobebros       # View logs
pm2 restart mayobebros    # Restart application
```

**Backup:**
```bash
tar -czf backup.tar.gz data/     # Create backup
tar -xzf backup.tar.gz           # Restore backup
```

---

### Support

- **Email:** info@mayobebros.com
- **Documentation:** See FILE_BASED_SYSTEM_GUIDE.md
- **Migration Status:** See MIGRATION_STATUS.md

---

**You're all set! Your website is now ready for Spaceship hosting!**
