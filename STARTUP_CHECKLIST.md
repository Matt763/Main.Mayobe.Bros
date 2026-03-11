# Startup Checklist - Run Your Website Now!

Follow these steps to get your website running in 5 minutes.

## Local Development (Your Computer)

### ✅ Step 1: Open Terminal/Command Prompt
- **Windows:** Press `Win + R`, type `cmd`, press Enter
- **Mac:** Press `Cmd + Space`, type `terminal`, press Enter
- **Linux:** Press `Ctrl + Alt + T`

### ✅ Step 2: Navigate to Project Folder
```bash
cd path/to/mayobebros
```

Replace `path/to/mayobebros` with the actual path where your project is located.

### ✅ Step 3: Install Dependencies (First Time Only)
```bash
npm install
```

Wait for installation to complete (may take 2-3 minutes).

### ✅ Step 4: Start the Development Server
```bash
npm run dev
```

You should see:
```
🚀 Mayobe Bros API Server running on http://localhost:3001
VITE ready in XXX ms
Local: http://localhost:5173
```

### ✅ Step 5: Open Your Browser
1. Open your web browser
2. Go to: **http://localhost:5173**
3. Your website is now running!

### ✅ Step 6: Login to Admin Panel
1. Click on admin login or go to: **http://localhost:5173/admin/login**
2. Enter credentials:
   - **Email:** `mbagamclean@gmail.com`
   - **Password:** `mambo dagas`
3. You're in! Start creating content.

---

## Deploying to Spaceship Hosting

### Before You Deploy - Build Production Version

### ✅ Step 1: Build Your Website
```bash
npm run build
```

This creates a `/dist` folder with your optimized website.

### ✅ Step 2: Test Production Build Locally (Optional)
```bash
npm start
```

Visit **http://localhost:3000** to verify everything works.

### ✅ Step 3: Prepare Files for Upload

**Files you MUST upload to Spaceship:**
- ✅ `/server` folder (entire folder)
- ✅ `/dist` folder (entire folder)
- ✅ `/data` folder (entire folder with all content)
- ✅ `production-server.js` file
- ✅ `package.json` file
- ✅ `package-lock.json` file

**Optional but recommended:**
- ✅ `/node_modules` folder (or run `npm install` on server)

**DO NOT upload:**
- ❌ `/src` folder (source code - not needed in production)
- ❌ `.env` file (if it exists)
- ❌ `.git` folder (if it exists)

### ✅ Step 4: Connect to Spaceship Hosting

**Option A: Using FTP/SFTP**
1. Open your FTP client (FileZilla, Cyberduck, etc.)
2. Connect to Spaceship using credentials they provided
3. Navigate to your web root folder (usually `public_html` or `www`)
4. Upload all files from Step 3

**Option B: Using File Manager (Control Panel)**
1. Login to Spaceship control panel
2. Open File Manager
3. Navigate to web root
4. Click "Upload" and select all files from Step 3

**Option C: Using SSH (Advanced)**
```bash
# Zip your project first
zip -r mayobebros.zip server/ dist/ data/ production-server.js package.json package-lock.json

# Upload to server
scp mayobebros.zip username@yourserver.com:/path/to/webroot/

# SSH into server
ssh username@yourserver.com

# Unzip
cd /path/to/webroot/
unzip mayobebros.zip
```

### ✅ Step 5: Install Dependencies on Server

**Via SSH:**
```bash
cd /path/to/webroot/
npm install --production
```

**Via Control Panel:**
Look for "Node.js" or "Terminal" option in your hosting control panel.

### ✅ Step 6: Start Your Application

**Ask Spaceship Support:** "How do I start a Node.js application?"

Common methods:

**Method 1: PM2 (Most Common)**
```bash
pm2 start production-server.js --name mayobebros
pm2 save
pm2 startup
```

**Method 2: Control Panel**
- Look for "Node.js Applications" in control panel
- Set entry point: `production-server.js`
- Click "Start"

**Method 3: Forever**
```bash
npm install -g forever
forever start production-server.js
```

**Method 4: Screen (Basic)**
```bash
screen -S mayobebros
npm start
# Press Ctrl+A then D to detach
```

### ✅ Step 7: Configure Your Domain
1. In Spaceship control panel, go to "Domains"
2. Point `www.mayobebros.com` to your application
3. If using proxy, point to port 3000
4. Enable SSL/HTTPS (usually free with Let's Encrypt)

### ✅ Step 8: Test Your Live Website
1. Visit **https://www.mayobebros.com**
2. Check that home page loads
3. Go to **https://www.mayobebros.com/admin/login**
4. Login with your credentials
5. Try creating a test post
6. Verify it appears on the public site

### ✅ Step 9: Change Your Password (IMPORTANT!)
1. On the server, edit `/data/auth/users.json`
2. Change the password to something secure
3. Save the file

**Example:**
```json
[
  {
    "id": "1",
    "email": "mbagamclean@gmail.com",
    "password": "YourNewSecurePassword123!",
    "role": "admin",
    "createdAt": "2026-02-11T00:00:00.000Z"
  }
]
```

### ✅ Step 10: Setup Regular Backups

**Simple backup script (Linux/Mac):**
```bash
#!/bin/bash
# Save as backup.sh
cd /path/to/your/website
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

**Schedule with cron:**
```bash
crontab -e
# Add this line to backup daily at 2 AM:
0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Problem: `npm: command not found`
**Solution:** Install Node.js from https://nodejs.org/

### Problem: Port 3001 or 5173 already in use
**Solution:** Kill the process or use different port:
```bash
# Find process
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Problem: Can't login to admin
**Solution:**
- Check `/data/auth/users.json` exists
- Verify credentials match exactly
- Clear browser cookies

### Problem: Images not showing
**Solution:**
- Check `/data/images/` folder exists
- Verify file permissions: `chmod 755 data/images/`

### Problem: Website not accessible on Spaceship
**Solution:**
- Check Node.js process is running: `pm2 status`
- Check logs: `pm2 logs mayobebros`
- Verify port 3000 is accessible
- Contact Spaceship support

---

## Quick Command Reference

```bash
# Local Development
npm install              # Install dependencies
npm run dev             # Start development server
npm run build           # Build for production
npm start               # Start production server

# On Spaceship Server
npm install --production              # Install production dependencies
pm2 start production-server.js       # Start with PM2
pm2 stop mayobebros                  # Stop application
pm2 restart mayobebros               # Restart application
pm2 logs mayobebros                  # View logs
pm2 status                           # Check status

# Backup
tar -czf backup.tar.gz data/         # Create backup
tar -xzf backup.tar.gz               # Restore backup
```

---

## Getting Help

### Spaceship Support Questions
1. "Do you support Node.js applications?"
2. "How do I deploy a Node.js Express app?"
3. "How do I start my Node.js application?"
4. "Do you provide PM2 or process manager?"
5. "How do I configure environment variables?"

### Your Support
- **Email:** info@mayobebros.com
- **Documentation:** See other guide files in project folder

---

## You're Done! 🎉

Your website should now be:
- ✅ Running locally for development
- ✅ Built and ready for production
- ✅ (Optional) Deployed on Spaceship hosting

**Next Steps:**
1. Start creating blog posts
2. Upload images
3. Customize site settings
4. Create pages (About, Contact, etc.)
5. Set up regular backups

**Remember:** All your data is in `/data` folder - back it up regularly!
