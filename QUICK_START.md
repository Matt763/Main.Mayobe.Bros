# Quick Start Guide - Mayobe Bros File-Based CMS

## Your New System

Your website now uses a **local file-based system** instead of cloud storage (Supabase). All content is stored in the `/data` folder.

## Login Credentials

**Admin Login:**
- Email: `mbagamclean@gmail.com`
- Password: `mambo dagas`

## Start Your Website

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

### 2. Start the Server
```bash
npm run dev
```

This starts both:
- **Backend API:** http://localhost:3001
- **Frontend Site:** http://localhost:5173

### 3. Access Admin Panel
1. Open: http://localhost:5173/admin/login
2. Login with credentials above
3. Start creating content!

## Data Location

**Everything is stored in the `/data` folder:**

```
data/
├── auth/users.json          # Login credentials
├── posts/                   # Blog posts (one file per post)
├── pages/                   # Static pages
├── categories/              # Post categories
├── labels/                  # Post tags
├── images/                  # Uploaded images
├── comments/                # User comments
├── reviews/                 # Site reviews
└── settings/                # Site configuration
```

## Backup Your Data

**Simple backup:**
```bash
# Create a zip file of all your data
zip -r backup-$(date +%Y%m%d).zip data/
```

**Or just copy the folder:**
```bash
cp -r data/ backup/
```

## Download Data for Spaceship Hosting

1. Navigate to your `/data` folder
2. Copy the entire folder
3. Upload to Spaceship hosting
4. All your content, images, and settings are included!

## Important Files

- **`FILE_BASED_SYSTEM_GUIDE.md`** - Complete documentation
- **`MIGRATION_STATUS.md`** - Current progress and next steps
- **`data/auth/users.json`** - Change your password here

## Troubleshooting

**Can't login?**
- Check `/data/auth/users.json` exists
- Verify email and password match exactly

**API errors?**
- Make sure backend is running: `npm run server`
- Check console for errors

**Images not showing?**
- Verify files are in `/data/images/`
- Check image paths in your posts

## Need Help?

- Read: `FILE_BASED_SYSTEM_GUIDE.md`
- Check: `MIGRATION_STATUS.md`
- Email: info@mayobebros.com

---

**Remember:** Backup the `/data` folder regularly - it contains your entire website!
