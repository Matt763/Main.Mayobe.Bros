# Mayobe Bros - File-Based Content Management System

Your website has been converted to a **local file-based system** that doesn't rely on cloud storage (Supabase). All content, images, and user data are now stored in local files that you can easily download and back up.

## System Architecture

### What Changed?
- **Before:** Used Supabase (cloud database) for storage
- **Now:** Uses local JSON files and a Node.js/Express backend server

### Benefits
- Complete control over your data
- Easy to backup (just copy the `/data` folder)
- No cloud service dependencies
- Works with Spaceship hosting or any Node.js hosting
- All content is portable and exportable

## Folder Structure

```
project/
├── data/                          # ALL YOUR WEBSITE DATA IS HERE
│   ├── auth/
│   │   └── users.json            # User credentials
│   ├── posts/                    # Blog posts (one JSON file per post)
│   │   ├── post-slug-1.json
│   │   └── post-slug-2.json
│   ├── pages/                    # Static pages (one JSON file per page)
│   │   ├── about-us.json
│   │   └── contact.json
│   ├── categories/
│   │   └── categories.json       # Post categories
│   ├── labels/
│   │   └── labels.json           # Post labels/tags
│   ├── images/                   # Uploaded images
│   │   ├── image1.jpg
│   │   └── image2.png
│   ├── comments/
│   │   └── comments.json         # User comments
│   ├── reviews/
│   │   └── reviews.json          # Site reviews
│   └── settings/
│       └── site-settings.json    # Site configuration
│
├── server/                        # Backend API server
│   ├── index.ts                  # Main server file
│   ├── routes/                   # API endpoints
│   ├── middleware/               # Authentication
│   └── utils/                    # File system utilities
│
└── src/                          # Frontend React app
    └── lib/
        └── api.ts                # API client (replaces Supabase)
```

## Default Login Credentials

**IMPORTANT:** Your admin credentials are:
- **Email:** `mbagamclean@gmail.com`
- **Password:** `mambo dagas`

These are stored in `/data/auth/users.json`. You can change them by editing that file directly.

## How to Run Your Website Locally

### Step 1: Start the Development Server
```bash
npm run dev
```

This command starts **both**:
1. Backend API server on `http://localhost:3001`
2. Frontend website on `http://localhost:5173`

### Step 2: Access Your Site
- **Public Website:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin/login
- **API Health Check:** http://localhost:3001/api/health

## How Data is Stored

### Posts and Pages
Each post and page is saved as a separate JSON file:
- **Location:** `/data/posts/` or `/data/pages/`
- **Filename:** Based on the slug (e.g., `my-first-post.json`)
- **Format:** JSON with all content, metadata, images, etc.

**Example post file:**
```json
{
  "id": "post-1234567890",
  "slug": "my-first-post",
  "title": "My First Post",
  "content": "Post content here...",
  "categoryId": "cat-123",
  "labelIds": ["label-1", "label-2"],
  "featuredImage": "/data/images/featured.jpg",
  "status": "published",
  "publishedAt": "2026-02-11T00:00:00.000Z",
  "createdAt": "2026-02-11T00:00:00.000Z",
  "updatedAt": "2026-02-11T00:00:00.000Z"
}
```

### Categories and Labels
Stored as arrays in single JSON files:
- **Categories:** `/data/categories/categories.json`
- **Labels:** `/data/labels/labels.json`

### Images
All uploaded images are stored in `/data/images/`:
- Original filenames are preserved with timestamp prefixes
- Referenced in posts/pages by their paths (e.g., `/data/images/123456-image.jpg`)

### Comments and Reviews
- **Comments:** `/data/comments/comments.json`
- **Reviews:** `/data/reviews/reviews.json`

## How to Backup Your Data

### Option 1: Copy the Entire Data Folder
```bash
# On Mac/Linux
cp -r data/ backup-2026-02-11/

# On Windows
xcopy data backup-2026-02-11\ /E /I
```

### Option 2: Create a Zip Archive
```bash
# On Mac/Linux
zip -r mayobebros-backup-2026-02-11.zip data/

# On Windows (PowerShell)
Compress-Archive -Path data -DestinationPath mayobebros-backup-2026-02-11.zip
```

### Option 3: Download via Your Hosting Panel
When deployed to Spaceship hosting, you can download the `/data` folder through:
- FTP/SFTP client
- File manager in hosting control panel
- SSH/terminal access

## Admin CMS Features

### Creating Content
1. Login to admin panel at `/admin/login`
2. Navigate to Posts, Pages, Categories, or Labels
3. Create new content using the rich text editor
4. Upload images via the Media Library
5. Publish or save as draft

### Managing Content
- **Edit:** Click on any item to edit
- **Delete:** Use the delete button (data file is removed)
- **Search:** Use the search bar to find specific content
- **Filter:** Filter by category, label, or status

### Image Upload
- Max file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Images are stored in `/data/images/`
- Access images at: `http://localhost:3001/data/images/filename.jpg`

## Deploying to Spaceship Hosting

### Prerequisites
- Node.js hosting support (Spaceship must support Node.js apps)
- Access to server file system
- Ability to run Node.js processes

### Deployment Steps

1. **Upload All Files**
   ```bash
   # Upload entire project folder to Spaceship hosting
   # Make sure to include:
   - /data folder (with all content)
   - /server folder (backend API)
   - /src folder (frontend)
   - package.json
   - All configuration files
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Frontend**
   ```bash
   npm run build
   ```

4. **Configure Server**
   - Update API_BASE_URL in production
   - Set correct PORT in server/index.ts
   - Configure CORS for your domain

5. **Start the Server**
   ```bash
   # Start the backend API
   npm run server

   # Serve the built frontend from /dist folder
   # Your hosting should serve the /dist folder as static files
   ```

### Environment Variables (if needed)
Create a `.env` file in the root:
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://www.mayobebros.com
```

## Important Notes

### Security
- **IMPORTANT:** The default password is stored in plain text in `/data/auth/users.json`
- For production, you should implement password hashing
- Change the default credentials immediately after deployment
- Consider adding HTTPS for secure authentication

### Data Persistence
- All data persists in the `/data` folder
- Regular backups are recommended
- If you delete the `/data` folder, ALL content is lost

### Scaling Considerations
- This system works well for small to medium websites
- For high traffic, consider:
  - Database migration (MySQL, PostgreSQL)
  - Caching layer (Redis)
  - CDN for images

### Troubleshooting

**API Connection Errors:**
- Ensure backend server is running on port 3001
- Check CORS configuration in `server/index.ts`
- Verify API_BASE_URL in `src/lib/api.ts`

**Login Issues:**
- Check `/data/auth/users.json` exists
- Verify credentials match exactly (case-sensitive)
- Check browser console for errors

**Images Not Loading:**
- Verify images exist in `/data/images/`
- Check image permissions (must be readable)
- Ensure static file serving is configured correctly

**Posts Not Appearing:**
- Check post status is "published"
- Verify JSON file is valid (use a JSON validator)
- Check console for API errors

## API Endpoints

Your backend exposes these REST API endpoints:

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current session
- `GET /api/auth/session` - Check current session

### Posts
- `GET /api/posts` - List all published posts
- `GET /api/posts/:slug` - Get single post
- `POST /api/posts` - Create new post (requires auth)
- `PUT /api/posts/:slug` - Update post (requires auth)
- `DELETE /api/posts/:slug` - Delete post (requires auth)

### Pages
- `GET /api/pages` - List all pages
- `GET /api/pages/:slug` - Get single page
- `POST /api/pages` - Create page (requires auth)
- `PUT /api/pages/:slug` - Update page (requires auth)
- `DELETE /api/pages/:slug` - Delete page (requires auth)

### Categories & Labels
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (requires auth)
- `PUT /api/categories/:id` - Update category (requires auth)
- `DELETE /api/categories/:id` - Delete category (requires auth)
- Same endpoints for `/api/labels`

### Images
- `GET /api/images` - List all images
- `POST /api/images/upload` - Upload image (requires auth)
- `DELETE /api/images/:filename` - Delete image (requires auth)
- `GET /data/images/:filename` - View image (public)

### Settings
- `GET /api/settings` - Get site settings
- `PUT /api/settings` - Update settings (requires auth)

### Comments & Reviews
- Similar CRUD endpoints for comments and reviews

## Contact Support

If you need help:
- **Website:** www.mayobebros.com
- **Email:** info@mayobebros.com

## Next Steps

1. Login to admin panel with default credentials
2. Change your password in `/data/auth/users.json`
3. Create your first post or page
4. Upload some images
5. Customize site settings
6. Create regular backups of the `/data` folder
7. When ready, deploy to Spaceship hosting

---

**Remember:** Your entire website is now contained in the `/data` folder. Back it up regularly!
