# Migration Status: Supabase to File-Based System

## What's Been Completed

### Backend Infrastructure (100% Complete)
The entire backend system has been successfully built and is ready to use:

1. **File Storage System** - `/data` folder with all necessary subdirectories
2. **Express API Server** - Complete REST API at `server/index.ts`
3. **Authentication System** - Session-based auth with default credentials
4. **API Endpoints** - Full CRUD operations for:
   - Posts (`/api/posts`)
   - Pages (`/api/pages`)
   - Categories (`/api/categories`)
   - Labels (`/api/labels`)
   - Images (`/api/images`)
   - Comments (`/api/comments`)
   - Reviews (`/api/reviews`)
   - Settings (`/api/settings`)
5. **Image Upload** - Multer-based file upload system
6. **API Client** - New `src/lib/api.ts` replaces Supabase client
7. **Auth Context** - Updated to use new API

### Default Login
- **Email:** `mbagamclean@gmail.com`
- **Password:** `mambo dagas`

## What Needs to Be Done

### Frontend Migration (In Progress)
The following files still need to be updated to use the new API instead of Supabase:

**Admin Pages (19 files):**
- `/src/pages/admin/PostsListPage.tsx`
- `/src/pages/admin/PostEditorPage.tsx`
- `/src/pages/admin/PagesListPage.tsx`
- `/src/pages/admin/PageEditorPage.tsx`
- `/src/pages/admin/CategoriesPage.tsx`
- `/src/pages/admin/LabelsPage.tsx`
- `/src/pages/admin/MediaLibraryPage.tsx`
- `/src/pages/admin/SettingsPage.tsx`
- `/src/pages/admin/CommentsPage.tsx`
- `/src/pages/admin/DashboardPage.tsx`
- `/src/components/admin/ImagePicker.tsx`

**Public Pages (10 files):**
- `/src/pages/Home.tsx`
- `/src/pages/PostPage.tsx`
- `/src/pages/EnhancedPostPage.tsx`
- `/src/pages/CategoryPage.tsx`
- `/src/pages/PopularPosts.tsx`
- `/src/pages/ContactUsPage.tsx`
- `/src/pages/AdvertisePage.tsx`

**Components (6 files):**
- `/src/components/Header.tsx`
- `/src/components/Footer.tsx`
- `/src/components/SearchBar.tsx`
- `/src/components/SearchModal.tsx`
- `/src/components/ReviewsSection.tsx`
- `/src/hooks/useSiteSettings.ts`

## How to Complete the Migration

### Option 1: Continue with Current Approach
Each file needs to be updated to:
1. Remove `import { supabase } from '../lib/supabase'`
2. Add `import { api } from '../lib/api'`
3. Replace Supabase queries with API calls

**Example conversion:**
```typescript
// OLD (Supabase)
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published');

// NEW (File-based API)
const posts = await api.posts.list({ status: 'published' });
```

### Option 2: Use Both Systems Temporarily
You can run both systems in parallel:
- Keep Supabase for frontend (already working)
- Use file-based system for backend exports
- Gradually migrate pages one by one

### Option 3: Hybrid Approach
Use Supabase for the live site but export data regularly to the file-based system for backups and portability.

## Running the New System

### Start Development Server
```bash
npm run dev
```

This starts:
- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### Test the API
```bash
# Health check
curl http://localhost:3001/api/health

# Login test
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mbagamclean@gmail.com","password":"mambo dagas"}'
```

## Data Management

### Backup Your Data
```bash
# Create backup
zip -r backup-$(date +%Y%m%d).zip data/
```

### Export from Spaceship
Once deployed, you can download the `/data` folder via:
- FTP/SFTP client
- Hosting control panel file manager
- SSH: `tar -czf data-backup.tar.gz data/`

## Next Steps

### Immediate Actions Needed:
1. **Decide on Migration Strategy** (Option 1, 2, or 3 above)
2. **Update Frontend Files** to use new API
3. **Test Each Page** after migration
4. **Update Build Configuration** if needed

### Before Deployment to Spaceship:
1. Complete frontend migration
2. Test all features locally
3. Create production build: `npm run build`
4. Configure production environment variables
5. Set up production server settings

## Important Notes

- **Data Safety:** All data is in `/data` folder - back it up regularly
- **Authentication:** Default password is plain text - implement hashing for production
- **Performance:** File-based system works well for small-medium sites
- **Scalability:** For high traffic, consider migrating to a database later

## Questions or Issues?

Contact: info@mayobebros.com

---

**Current Status:** Backend infrastructure complete, frontend migration in progress.
