# Mayobe Bros Staff CMS - Configuration Guide

This guide covers all technical configuration needed to set up and customize your CMS.

---

## Environment Variables

Your CMS requires these environment variables in the `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are already configured if you're using the provided Supabase instance.

---

## Pexels API Integration

The CMS includes Pexels integration for free stock photos. To enable it:

### Getting a Pexels API Key

1. Visit [https://www.pexels.com/api/](https://www.pexels.com/api/)
2. Sign up for a free account
3. Navigate to "API" section
4. Copy your API key

### Configuring the API Key

1. Open `src/components/admin/ImagePicker.tsx`
2. Find line: `const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY';`
3. Replace `'YOUR_PEXELS_API_KEY'` with your actual key:
   ```typescript
   const PEXELS_API_KEY = 'your-actual-api-key-here';
   ```
4. Save the file and rebuild the project

**Note**: For production, store the API key in an environment variable:
```env
VITE_PEXELS_API_KEY=your_pexels_api_key
```

Then update the code to:
```typescript
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
```

---

## Database Configuration

The CMS uses the following Supabase tables:

### Required Tables

All tables are already created with the migrations. Here's a reference:

#### Core Content Tables
- `posts` - Blog posts with full metadata
- `static_pages` - Static website pages
- `categories` - Content categories
- `labels` - Sub-categories within categories

#### Engagement Tables
- `comments` - User comments on posts
- `reactions` - Post reactions (love, wow, etc.)
- `reviews` - Site reviews

#### Media & Settings
- `media_library` - Uploaded images and files
- `site_settings` - Key-value configuration store

#### Other Tables
- `newsletter_subscribers` - Email subscribers
- `contact_submissions` - Contact form submissions
- `chat_conversations` - Chat history (future feature)

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Public Read**: Most content is publicly readable
- **Authenticated Write**: Only authenticated users can create/update
- **Admin Only**: Some tables restrict to admin users

---

## Authentication Setup

### Creating Admin Users

To create admin users in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User**
4. Enter email and password
5. **Important**: Set a secure password
6. User can now log in at `/admin/login`

### Password Requirements

For security:
- Minimum 8 characters
- Mix of uppercase and lowercase
- Include numbers
- Include special characters

### Resetting Passwords

Admins can reset passwords through Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Find the user
3. Click **Reset Password**
4. User receives email with reset link

---

## Site Settings Configuration

Configure your site through the admin panel or directly in database.

### Initial Settings to Configure

Go to **Admin** → **Settings** and set:

#### General
- **site_title**: "Mayobe Bros"
- **site_tagline**: "Your tagline here"
- **site_description**: Full site description
- **logo_url**: "/mayobebroslogo.png"
- **favicon_url**: "/mayobebrosfavicon.png"

#### Appearance
- **default_theme**: "light" | "dark" | "auto"
- **primary_color**: "#3B82F6" (or your brand color)
- **font_family**: "Inter" | "Roboto" | "Open Sans"

#### SEO
- **default_meta_title**: "{page_title} | Mayobe Bros"
- **default_meta_description**: Your default description
- **google_analytics_id**: "G-XXXXXXXXXX"
- **google_search_console**: "verification-code"

#### Social
- **facebook_url**: "https://facebook.com/yourpage"
- **twitter_url**: "https://twitter.com/youraccount"
- **instagram_url**: "https://instagram.com/youraccount"
- **linkedin_url**: "https://linkedin.com/company/yourcompany"

#### Advanced
- **custom_css**: Custom CSS code
- **custom_js**: Custom JavaScript
- **footer_copyright**: "© 2026 Mayobe Bros. All rights reserved."

---

## Logo and Favicon Setup

### Logo Requirements

**Recommended Specifications:**
- Format: PNG with transparency
- Dimensions: 240px × 60px (or similar aspect ratio)
- Max file size: 100KB
- Background: Transparent
- Color: Use brand colors

**Current Logo:** `/mayobebroslogo.png`

To update:
1. Replace the file in `/public/` directory
2. Or update `logo_url` in settings to new path

### Favicon Requirements

**Recommended Specifications:**
- Format: PNG
- Dimensions: 512px × 512px (for best compatibility)
- Alternative: 32×32, 64×64, 128×128, 256×256
- Max file size: 50KB
- Background: Can be transparent or solid

**Current Favicon:** `/mayobebrosfavicon.png`

The `index.html` file already includes proper favicon references:
```html
<link rel="icon" type="image/png" sizes="32x32" href="/mayobebrosfavicon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/mayobebrosfavicon.png" />
```

---

## Theme Customization

### Color Palette

The CMS uses a luxury color scheme defined in `tailwind.config.js`:

```javascript
colors: {
  luxury: {
    50: '#fafaf9',   // Lightest gray
    100: '#f5f5f4',
    // ... through to ...
    950: '#0c0a09',  // Pure black
  },
  gold: {
    50: '#fefce8',   // Light gold
    // ... through to ...
    900: '#713f12',  // Dark gold
  },
}
```

### Customizing Colors

To change the primary blue color:

1. Open `tailwind.config.js`
2. Add custom color:
```javascript
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',  // Your brand color
    600: '#2563eb',
    700: '#1d4ed8',
  }
}
```
3. Update components to use `bg-primary-500` instead of `bg-blue-500`

### Dark Mode Colors

Dark mode uses:
- **Background**: Pure black `#000000`
- **Cards**: Gray-900 `#111827`, Gray-800 `#1f2937`
- **Text**: White `#ffffff`, Gray-300 `#d1d5db`
- **Borders**: Gray-700 `#374151`

To customize, edit dark mode classes in components.

---

## Font Configuration

### Available Fonts

By default, the system uses system fonts for performance. To use custom fonts:

### Google Fonts Integration

1. Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

2. Update `tailwind.config.js`:
```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
  },
}
```

3. Or set in **Settings** → **Appearance** → **Font Family**

---

## Email Configuration

### Newsletter Subscriptions

Email subscriptions are stored in `newsletter_subscribers` table.

To send newsletters, you'll need to integrate an email service:

**Recommended Services:**
- SendGrid
- Mailchimp
- ConvertKit
- Mailgun

**Integration Steps:**
1. Sign up for email service
2. Get API key
3. Create Supabase Edge Function to handle sends
4. Connect to `newsletter_subscribers` table

### Contact Form Emails

Contact submissions go to `contact_submissions` table.

To receive email notifications:
1. Create Edge Function
2. Trigger on new contact submission
3. Send email via service like SendGrid

---

## SEO Configuration

### Google Analytics

1. Create Google Analytics 4 property
2. Get Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to **Settings** → **SEO** → **Google Analytics ID**
4. The CMS will inject tracking code automatically

### Google Search Console

1. Verify site ownership in Search Console
2. Get verification meta tag
3. Add to **Settings** → **SEO** → **Search Console Verification**

### Sitemap

To generate a sitemap:
1. Create a sitemap generator script
2. Query all published posts and pages
3. Generate XML sitemap
4. Submit to Google Search Console

---

## Performance Optimization

### Image Optimization

**Before Upload:**
- Resize images to appropriate dimensions
- Compress using tools like TinyPNG or ImageOptim
- Convert to WebP format when possible
- Target under 500KB per image

**After Upload:**
- Use responsive images with `srcset`
- Lazy load images below fold
- Use CDN for faster delivery

### Build Optimization

The build may show chunk size warnings. To optimize:

1. **Code Splitting**: Use dynamic imports:
```typescript
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
```

2. **Manual Chunks** in `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'supabase': ['@supabase/supabase-js'],
      },
    },
  },
}
```

### Caching Strategy

- **Static Assets**: Long cache (1 year)
- **Images**: Medium cache (1 month)
- **HTML**: Short cache (5 minutes)
- **API Responses**: No cache or short cache

---

## Backup Strategy

### Database Backups

Supabase provides automatic backups. For additional safety:

1. **Manual Exports**: Use Supabase Dashboard
2. **Scheduled Exports**: Set up daily/weekly exports
3. **Version Control**: Keep SQL migrations in git

### Content Backup

Regular backups of:
- All posts (export as JSON)
- Static pages
- Categories and labels
- Site settings
- Media library file list

### Restoration

To restore from backup:
1. Create new Supabase project (if needed)
2. Run all migrations
3. Import data from backup
4. Update `.env` with new credentials

---

## Security Best Practices

### Admin Access

- **Strong Passwords**: Minimum 12 characters
- **Limited Users**: Only create accounts for staff
- **Regular Audits**: Review user list quarterly
- **2FA**: Enable if available in Supabase

### Content Security

- **Input Validation**: All forms validate input
- **XSS Protection**: Content sanitized before display
- **CSRF Protection**: Tokens used for state changes
- **RLS Policies**: Database enforces access rules

### API Keys

- **Never Commit**: Don't push API keys to git
- **Use Environment Variables**: Store in `.env`
- **Rotate Regularly**: Change keys every 6 months
- **Limit Permissions**: Use minimal required scopes

---

## Monitoring & Analytics

### Built-in Analytics

The Dashboard shows:
- Total posts, views, comments
- Engagement rate
- Recent activity
- Popular content

### External Analytics

Integrate with:
- **Google Analytics**: Detailed visitor analytics
- **Google Search Console**: SEO performance
- **Cloudflare Analytics**: If using Cloudflare
- **Custom**: Build with Edge Functions

---

## Troubleshooting

### Build Errors

**Module not found:**
```bash
npm install
npm run build
```

**Type errors:**
```bash
npm run typecheck
```

**Port in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Runtime Errors

**Supabase connection failed:**
- Check `.env` variables are set
- Verify Supabase project is active
- Check API keys are valid

**Images not loading:**
- Verify file paths are correct
- Check file permissions
- Ensure Pexels API key is set

**Authentication issues:**
- Clear browser cookies
- Check Supabase auth settings
- Verify email/password are correct

---

## Deployment

### Building for Production

```bash
npm run build
```

Output goes to `dist/` directory.

### Deployment Platforms

**Recommended:**
- **Vercel**: Zero-config deployment
- **Netlify**: Easy continuous deployment
- **Cloudflare Pages**: Fast edge deployment
- **AWS Amplify**: Full AWS integration

### Environment Variables

Set in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PEXELS_API_KEY` (optional)

### Post-Deployment Checklist

- [ ] Test admin login
- [ ] Create first post
- [ ] Verify images upload
- [ ] Check mobile responsiveness
- [ ] Test theme toggle
- [ ] Verify search works
- [ ] Check all navigation links
- [ ] Test contact form
- [ ] Submit sitemap to Google
- [ ] Set up monitoring

---

## Updates & Maintenance

### Regular Maintenance

**Weekly:**
- Review and moderate comments
- Check for spam
- Update featured posts

**Monthly:**
- Delete unused media
- Review analytics
- Update content
- Check for broken links

**Quarterly:**
- Audit user accounts
- Review and update policies
- Backup full database
- Update dependencies

### Updating the CMS

When new versions are available:

1. Backup current database
2. Pull latest code
3. Run migrations
4. Test in staging environment
5. Deploy to production
6. Verify all features work

---

## Support & Resources

### Documentation

- `CMS_USER_GUIDE.md` - Complete user guide
- `THEME_AND_SEARCH_GUIDE.md` - Theme and search features
- `CMS_CONFIGURATION.md` - This file

### External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Pexels API](https://www.pexels.com/api/documentation/)

### Getting Help

For technical support:
1. Check documentation first
2. Review error messages
3. Search for similar issues
4. Contact site administrator
5. Create detailed bug report

---

## Appendix: File Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx        # Main admin layout
│   │   ├── RichTextEditor.tsx     # WYSIWYG editor
│   │   ├── ImagePicker.tsx        # Image selection modal
│   │   └── Toast.tsx              # Notifications
│   ├── Header.tsx                 # Site header
│   ├── Footer.tsx                 # Site footer
│   ├── SearchBar.tsx              # Live search
│   └── ThemeToggle.tsx            # Theme switcher
├── pages/
│   ├── admin/
│   │   ├── DashboardPage.tsx      # Admin dashboard
│   │   ├── PostsListPage.tsx      # Posts list
│   │   ├── PostEditorPage.tsx     # Post editor
│   │   ├── PagesListPage.tsx      # Pages list
│   │   ├── PageEditorPage.tsx     # Page editor
│   │   ├── CategoriesPage.tsx     # Categories manager
│   │   ├── LabelsPage.tsx         # Labels manager
│   │   ├── CommentsPage.tsx       # Comment moderation
│   │   ├── SettingsPage.tsx       # Site settings
│   │   ├── MediaLibraryPage.tsx   # Media manager
│   │   └── LoginPage.tsx          # Admin login
│   ├── Home.tsx                   # Homepage
│   ├── CategoryPage.tsx           # Category listings
│   ├── EnhancedPostPage.tsx       # Single post view
│   └── NotFoundPage.tsx           # 404 page
├── contexts/
│   ├── AuthContext.tsx            # Authentication
│   └── ThemeContext.tsx           # Theme management
├── lib/
│   └── supabase.ts                # Supabase client
└── index.css                      # Global styles
```

---

**Configuration Guide Version 1.0.0**
*Last Updated: 2026-02-11*
