# Mayobe Bros - File-Based Content Management System

A complete blog and CMS platform with local file storage. No cloud dependencies.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

This starts:
- **Backend API:** http://localhost:3001
- **Frontend:** http://localhost:5173

### 3. Login to Admin Panel
- **URL:** http://localhost:5173/admin/login
- **Email:** mbagamclean@gmail.com
- **Password:** mambo dagas

## Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

This serves both the API and frontend on port 3000.

## Project Structure

```
mayobebros/
├── data/                    # All your content (BACKUP THIS!)
│   ├── auth/               # User credentials
│   ├── posts/              # Blog posts (one JSON file per post)
│   ├── pages/              # Static pages
│   ├── categories/         # Post categories
│   ├── labels/             # Post tags
│   ├── images/             # Uploaded images
│   ├── comments/           # User comments
│   ├── reviews/            # Site reviews
│   └── settings/           # Site configuration
├── server/                 # Backend API (Express.js)
├── src/                    # Frontend (React)
├── production-server.js    # Production server file
└── package.json
```

## Documentation

- **QUICK_START.md** - Get started quickly
- **SPACESHIP_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **FILE_BASED_SYSTEM_GUIDE.md** - Full system documentation
- **MIGRATION_STATUS.md** - Current system status

## Backup Your Data

Your entire website is in the `/data` folder. Back it up regularly:

```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Or simple copy
cp -r data/ backup/
```

## Spaceship Hosting

See **SPACESHIP_DEPLOYMENT_GUIDE.md** for complete deployment instructions.

Quick deployment checklist:
1. Build: `npm run build`
2. Upload all files to Spaceship
3. Run: `npm install --production`
4. Start: `npm start` or use PM2

## Features

- File-based content storage (no database required)
- Complete admin CMS panel
- Rich text editor for posts and pages
- Image upload and management
- Categories and labels/tags
- User comments system
- Site reviews
- Responsive design
- Dark mode support
- Search functionality

## Support

- **Website:** https://www.mayobebros.com
- **Email:** info@mayobebros.com

## Important Notes

- Change the default password in `/data/auth/users.json`
- All content is stored in `/data` - keep regular backups
- For production, use HTTPS and secure session secrets
- The system works great for small to medium websites

## Commands

```bash
npm install          # Install dependencies
npm run dev         # Development mode (hot reload)
npm run build       # Build for production
npm start           # Start production server
npm run server      # Backend only
```

## Technology Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express.js
- **Storage:** JSON files (no database)
- **Authentication:** Session-based
- **Image Upload:** Multer

---

**Made with care for Mayobe Bros** 🚀
