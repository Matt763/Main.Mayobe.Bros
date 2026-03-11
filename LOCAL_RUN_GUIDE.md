# How to Run Your Website Locally - Step by Step

## ✅ Build Status: SUCCESS
Your website builds without errors and is ready to run!

---

## Prerequisites Check

Before starting, verify you have Node.js installed:

```bash
node --version
# Should show: v18.x.x or higher

npm --version
# Should show: 9.x.x or higher
```

**Don't have Node.js?**
1. Go to https://nodejs.org/
2. Download the LTS version
3. Install it
4. Restart your terminal

---

## Running Locally - Complete Instructions

### Step 1: Open Terminal in Project Folder

**Windows:**
1. Open File Explorer
2. Navigate to your project folder
3. Type `cmd` in the address bar and press Enter

**Mac:**
1. Open Terminal
2. Type: `cd ` (with a space at the end)
3. Drag your project folder into Terminal
4. Press Enter

**Linux:**
1. Right-click in project folder
2. Select "Open Terminal Here"

### Step 2: Install Dependencies

This downloads all required packages (only needed once):

```bash
npm install
```

**What you'll see:**
- Progress bar showing downloads
- Takes 2-3 minutes on first run
- Creates `/node_modules` folder

**If you see errors:**
- Try: `npm install --legacy-peer-deps`
- Or delete `node_modules` folder and `package-lock.json`, then try again

### Step 3: Start Development Server

```bash
npm run dev
```

**What happens:**
1. Backend API server starts on port 3001
2. Frontend website starts on port 5173
3. Both run simultaneously

**Expected output:**
```
🚀 Mayobe Bros API Server running on http://localhost:3001

VITE v5.4.8 ready in 823 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal window open!** Closing it stops the servers.

### Step 4: Open Your Website

Open your web browser and go to:

**http://localhost:5173**

You should see your website!

### Step 5: Access Admin Panel

In your browser, go to:

**http://localhost:5173/admin/login**

**Login with:**
- Email: `mbagamclean@gmail.com`
- Password: `mambo dagas`

After logging in, you'll see the admin dashboard with:
- Posts management
- Pages management
- Categories
- Labels
- Media library
- Comments
- Settings

---

## Creating Your First Post

1. Click **"Posts"** in the sidebar
2. Click **"Create New Post"** button
3. Fill in:
   - Title: "My First Post"
   - Content: Write something...
   - Category: Select or create one
   - Status: Published
4. Click **"Save"** or **"Publish"**
5. Visit your homepage to see it!

---

## Uploading Images

1. Click **"Media Library"** in sidebar
2. Click **"Upload Image"** button
3. Select an image from your computer
4. Image is saved to `/data/images/`
5. Use it in posts by clicking "Insert Image"

---

## Stopping the Server

When you're done:

**Press:** `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac) in the terminal

This stops both servers.

**Next time:** Just run `npm run dev` again!

---

## Common Issues & Solutions

### Issue: "Port 3001 is already in use"

**Solution 1 - Find and stop the process:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

**Solution 2 - Restart your computer**

### Issue: "Port 5173 is already in use"

Same as above, but use port 5173.

### Issue: "npm: command not found"

**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Cannot find module 'express'"

**Solution:** Run `npm install` again

### Issue: Login not working

**Check:**
1. File `/data/auth/users.json` exists
2. Email is: `mbagamclean@gmail.com` (exact spelling)
3. Password is: `mambo dagas` (with space, exact spelling)
4. Clear browser cookies and try again

### Issue: Images not displaying

**Check:**
1. Folder `/data/images/` exists
2. Backend server is running (port 3001)
3. Check browser console for errors (F12)

### Issue: Posts not appearing

**Check:**
1. Post status is "published"
2. Post has a category assigned
3. Refresh the page (Ctrl + F5)
4. Check console for errors

---

## Understanding the Ports

### Port 3001 - Backend API
- Handles all data operations
- Serves images from `/data/images/`
- Manages authentication
- **Must be running for website to work**

### Port 5173 - Frontend Website
- Your React application
- Admin panel
- Public pages
- Communicates with port 3001

**Both must be running during development!**

---

## File Locations

### Your Content (All in `/data` folder)

```
data/
├── auth/
│   └── users.json           ← Your login credentials
├── posts/
│   ├── my-first-post.json   ← Blog posts (one file per post)
│   └── another-post.json
├── pages/
│   └── about.json           ← Static pages
├── categories/
│   └── categories.json      ← All categories
├── labels/
│   └── labels.json          ← All tags/labels
├── images/
│   ├── photo1.jpg           ← Uploaded images
│   └── photo2.png
├── comments/
│   └── comments.json        ← User comments
├── reviews/
│   └── reviews.json         ← Site reviews
└── settings/
    └── site-settings.json   ← Site configuration
```

### Backup This Folder!
The `/data` folder contains your entire website. Back it up regularly:

```bash
# Create backup
zip -r backup-$(date +%Y%m%d).zip data/

# Or copy
cp -r data/ backup-data/
```

---

## Development Workflow

### Daily Workflow:

1. **Start servers:**
   ```bash
   npm run dev
   ```

2. **Work on your site:**
   - Create posts
   - Upload images
   - Edit pages
   - Change settings

3. **See changes instantly:**
   - Frontend hot-reloads automatically
   - Just save and refresh browser

4. **Stop when done:**
   ```bash
   Ctrl + C
   ```

### Making Changes to Code:

1. Edit files in `/src` folder
2. Save the file
3. Browser automatically reloads
4. See your changes instantly!

---

## Testing Before Deployment

### Test Production Build Locally:

```bash
# Build the production version
npm run build

# Start production server
npm start
```

Visit: **http://localhost:3000**

This simulates how your site will run on Spaceship hosting.

**Stop test server:** Press `Ctrl + C`

---

## Ready to Deploy?

Once you're happy with your site locally, see:
- **SPACESHIP_DEPLOYMENT_GUIDE.md** for deployment steps

---

## Quick Reference Commands

```bash
# First time setup
npm install                   # Install dependencies

# Development
npm run dev                  # Start dev servers (port 3001 + 5173)
npm run server               # Start backend only
npm run client               # Start frontend only

# Production testing
npm run build                # Build for production
npm start                    # Run production server (port 3000)

# Utilities
npm run lint                 # Check code quality
npm run typecheck            # Check TypeScript types
```

---

## Browser Developer Tools

Press **F12** in your browser to open developer tools:

- **Console tab:** See errors and logs
- **Network tab:** See API requests
- **Application tab:** See cookies and storage

Useful for debugging issues!

---

## Getting Help

### Check These Files:
1. **START_HERE.md** - Quick overview
2. **SPACESHIP_DEPLOYMENT_GUIDE.md** - Deployment guide
3. **FILE_BASED_SYSTEM_GUIDE.md** - Technical details
4. **README.md** - Project overview

### Still Need Help?
- Email: info@mayobebros.com

---

## Summary

**To run your website locally:**

1. Install Node.js (if needed)
2. Open terminal in project folder
3. Run: `npm install` (first time only)
4. Run: `npm run dev`
5. Visit: http://localhost:5173
6. Admin: http://localhost:5173/admin/login

**That's it!** Your website is now running on your computer.

---

**Happy coding!** 🚀
