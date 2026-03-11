# START HERE - Mayobe Bros Website

## ✅ Build Status: SUCCESS

Your website has been successfully converted to a file-based system and builds without errors!

---

## 🚀 Quick Start - 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development
```bash
npm run dev
```

### Step 3: Open Browser
- **Website:** http://localhost:5173
- **Admin:** http://localhost:5173/admin/login
- **Login:**
  - Email: `mbagamclean@gmail.com`
  - Password: `mambo dagas`

---

## 📦 What's Inside

### Your Data Folder (`/data`)
Everything is stored here. **Backup this folder regularly!**

```
data/
├── auth/users.json          # Your login credentials
├── posts/                   # Blog posts (one file per post)
├── pages/                   # Static pages
├── categories/              # Categories
├── labels/                  # Tags/labels
├── images/                  # All uploaded images
├── comments/                # User comments
├── reviews/                 # Site reviews
└── settings/                # Site configuration
```

### Backend Server (`/server`)
Express.js API that handles all operations:
- Authentication
- Posts/Pages management
- Image uploads
- Categories & Labels
- Comments & Reviews

### Frontend (`/src`)
React-based website with admin CMS panel.

---

## 📚 Documentation

Read these guides in order:

1. **STARTUP_CHECKLIST.md** ← Start here for detailed steps
2. **SPACESHIP_DEPLOYMENT_GUIDE.md** ← How to deploy to Spaceship
3. **FILE_BASED_SYSTEM_GUIDE.md** ← Complete technical documentation
4. **README.md** ← Project overview

---

## 🌐 Deploy to Spaceship Hosting

### Quick Deployment Process

**1. Build your website:**
```bash
npm run build
```

**2. Upload to Spaceship:**
- `/server` folder
- `/dist` folder
- `/data` folder
- `production-server.js`
- `package.json`
- `package-lock.json`

**3. On Spaceship server:**
```bash
npm install --production
npm start
```

Or with PM2:
```bash
pm2 start production-server.js --name mayobebros
```

**4. Configure domain:**
Point `www.mayobebros.com` to your application (port 3000).

---

## ⚙️ Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start development (hot reload)

# Production
npm run build           # Build optimized version
npm start               # Start production server

# Server only
npm run server          # Run backend API only
```

---

## 🔧 How It Works

### Local Development (Two Servers)
When you run `npm run dev`:
1. **Backend API** starts on port 3001 (handles data)
2. **Frontend** starts on port 5173 (React app)
3. They communicate via API calls

### Production (One Server)
When you run `npm start`:
1. **One server** on port 3000
2. Serves both API and static frontend
3. Everything in one place

---

## 💾 Backup Your Data

### Simple Backup
```bash
# Create a zip file
zip -r backup-$(date +%Y%m%d).zip data/

# Or just copy the folder
cp -r data/ backup/
```

### Download from Spaceship
Once deployed:
1. Login via FTP/SFTP
2. Download the `/data` folder
3. Save to your computer

---

## 🔒 Security Checklist

### Before Going Live:

1. **Change default password**
   Edit `/data/auth/users.json`:
   ```json
   {
     "email": "mbagamclean@gmail.com",
     "password": "YOUR-NEW-SECURE-PASSWORD"
   }
   ```

2. **Enable HTTPS**
   Configure SSL certificate in Spaceship (usually free).

3. **Secure session secret**
   In production, set a secure SESSION_SECRET environment variable.

4. **Set file permissions** (on server)
   ```bash
   chmod 700 data/
   chmod 600 data/auth/users.json
   ```

---

## ❓ Troubleshooting

### Build fails?
- Make sure Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again

### Can't login?
- Check `/data/auth/users.json` exists
- Verify email and password match exactly (case-sensitive)

### Port already in use?
- Kill the process or use a different port
- Check what's running: `lsof -i :3001`

### Images not showing?
- Check `/data/images/` folder exists
- Verify image paths in posts are correct

---

## 📞 Need Help?

### Questions for Spaceship Support:
1. "Do you support Node.js applications?"
2. "How do I deploy a Node.js Express application?"
3. "How do I start my Node.js app on your server?"
4. "Do you provide PM2 or a process manager?"

### Your Support:
- **Website:** https://www.mayobebros.com
- **Email:** info@mayobebros.com

---

## ✨ Features

- ✅ Complete CMS admin panel
- ✅ Rich text editor for posts/pages
- ✅ Image upload and management
- ✅ Categories and tags
- ✅ User comments system
- ✅ Site reviews
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Search functionality
- ✅ SEO-friendly URLs
- ✅ File-based storage (no database needed!)

---

## 🎯 Next Steps

1. ✅ Build completed successfully
2. ⏭️ Run `npm run dev` to start development
3. ⏭️ Login to admin panel
4. ⏭️ Create your first post
5. ⏭️ Upload some images
6. ⏭️ Customize site settings
7. ⏭️ When ready, deploy to Spaceship

---

## 📁 What Gets Deployed

### Required Files for Spaceship:
```
✅ server/               Backend API code
✅ dist/                 Built frontend (after npm run build)
✅ data/                 All your content
✅ production-server.js  Production server
✅ package.json          Dependencies list
✅ package-lock.json     Dependency versions
```

### Optional:
```
📦 node_modules/        (or run npm install on server)
```

### Not Needed in Production:
```
❌ src/                 Source code (already built to dist/)
❌ .git/                Git repository
❌ .env                 Local environment file
```

---

## 🎉 You're All Set!

Your website is ready to run. Start with:

```bash
npm run dev
```

Then visit: **http://localhost:5173**

---

**Built with ❤️ for Mayobe Bros**
