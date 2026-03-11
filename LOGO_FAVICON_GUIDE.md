# Logo and Favicon Configuration Guide

This guide explains how to update your website logo and favicon, which are now fully integrated with the CMS settings.

---

## How It Works Now

Your logo and favicon are **dynamically loaded from the site settings** stored in your Supabase database. This means:

1. You upload/save logo and favicon settings in the Admin Settings page
2. The changes appear **immediately** across your entire website
3. Header, Footer, and browser tabs all update automatically
4. No need to manually edit code or upload files

---

## Updating Logo and Favicon

### Method 1: Using Admin Settings (Recommended)

1. **Log in to Admin Portal**
   - Go to `/admin/login`
   - Enter your credentials

2. **Navigate to Settings**
   - Click "Settings" in the sidebar
   - Go to the "General" tab

3. **Update Logo URL**
   - Find the "Logo URL" field
   - Enter the path to your logo image
   - Example: `/mayobebroslogo.png`
   - Or use a full URL: `https://yourdomain.com/path/to/logo.png`

4. **Update Favicon URL**
   - Find the "Favicon URL" field
   - Enter the path to your favicon image
   - Example: `/mayobebrosfavicon.png`
   - Or use a full URL: `https://yourdomain.com/path/to/favicon.ico`

5. **Save Settings**
   - Click "Save Settings" button at the bottom
   - Your changes take effect **immediately**
   - Refresh your website to see the updates

### Method 2: Direct File Upload

If you want to use local files:

1. **Upload Files to Public Directory**
   - Place your logo file in `/public/` directory
   - Place your favicon file in `/public/` directory
   - Example paths:
     - `/public/mylogo.png`
     - `/public/myfavicon.png`

2. **Update Settings**
   - Go to Admin → Settings → General
   - Set Logo URL to: `/mylogo.png`
   - Set Favicon URL to: `/myfavicon.png`
   - Save settings

3. **Rebuild Project**
   - Run `npm run build`
   - Files in `/public/` are copied to build output automatically

### Method 3: Use External URLs

You can also use images hosted elsewhere:

1. **Upload to Image Hosting**
   - Upload your logo to any image hosting service
   - Upload your favicon to any image hosting service
   - Copy the full URLs

2. **Update Settings**
   - Go to Admin → Settings → General
   - Set Logo URL to: `https://yourdomain.com/images/logo.png`
   - Set Favicon URL to: `https://yourdomain.com/images/favicon.png`
   - Save settings

---

## File Specifications

### Logo Requirements

**Recommended Specifications:**
- **Format**: PNG with transparent background
- **Dimensions**: 240px × 60px (4:1 aspect ratio)
- **Alternative sizes**: 200×50, 300×75, 400×100
- **Max file size**: 100KB
- **Color mode**: RGB
- **Background**: Transparent (so it works on light and dark modes)

**Important Notes:**
- The logo automatically inverts colors in dark mode
- Use a dark logo on transparent background for best results
- Logo scales automatically to fit header height (40px on mobile, 50px on desktop)
- Maximum width is constrained (150px mobile, 200px desktop)

### Favicon Requirements

**Recommended Specifications:**
- **Format**: PNG or ICO
- **Dimensions**: 512×512px (best compatibility)
- **Alternative sizes**: 32×32, 64×64, 128×128, 256×256
- **Max file size**: 50KB
- **Background**: Can be transparent or solid color

**Supported Locations:**
- Browser tabs
- Bookmarks
- Mobile home screen icons
- PWA icons

---

## Where Logo Appears

Your logo automatically appears in:

1. **Website Header** (top-left corner)
   - Desktop: 40-50px height
   - Mobile: 32-40px height
   - Auto-inverts in dark mode

2. **Footer** (bottom-left section)
   - 48px height
   - Always inverted (white) since footer is dark

3. **Admin Portal**
   - Sidebar logo (if you configure admin separately)

---

## Where Favicon Appears

Your favicon automatically appears in:

1. **Browser Tabs**
   - Shows next to page title
   - Updates for all pages

2. **Bookmarks**
   - When users bookmark your site

3. **Browser History**
   - In browser history list

4. **Mobile Device**
   - When adding to home screen
   - As app icon on mobile

---

## Troubleshooting

### Logo Not Updating

**Issue**: Changed logo URL but old logo still shows

**Solutions**:
1. **Hard refresh browser**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache**: Go to browser settings and clear cache
3. **Check URL is correct**: Verify the path or URL you entered
4. **Check file exists**: Make sure the file is actually at that location
5. **Wait a moment**: Settings can take a few seconds to propagate

### Favicon Not Updating

**Issue**: Changed favicon URL but old icon still shows

**Solutions**:
1. **Clear browser cache completely**: Favicons are heavily cached
2. **Close and reopen browser**: Sometimes necessary for favicon updates
3. **Check multiple browsers**: Test in Chrome, Firefox, Safari
4. **Verify file format**: Use PNG or ICO format
5. **Check file size**: Must be under 50KB
6. **Force reload**: Visit `yourdomain.com/favicon.png` directly to check if file loads

### Logo Appears Distorted

**Issue**: Logo is stretched or squished

**Solutions**:
1. **Check aspect ratio**: Use recommended 4:1 ratio (width:height)
2. **Use correct dimensions**: 240×60px or similar proportions
3. **Save as PNG**: Avoid JPEG for logos (causes quality loss)
4. **Remove fixed dimensions**: Logo should scale proportionally

### Logo Not Visible in Dark Mode

**Issue**: Logo disappears or is hard to see in dark mode

**Solutions**:
1. **Use transparent background**: Don't use white background
2. **Use dark logo color**: System inverts it automatically
3. **Test both modes**: Check Settings → Appearance → switch themes
4. **Remove white fill**: Ensure logo has no white background layer

### Favicon Low Quality

**Issue**: Favicon looks pixelated or blurry

**Solutions**:
1. **Use larger size**: Start with 512×512px PNG
2. **Use vector source**: Convert SVG to PNG at high resolution
3. **Avoid upscaling**: Don't resize small images to larger
4. **Use PNG format**: Better quality than ICO for modern browsers

---

## Best Practices

### Logo Best Practices

1. **Keep it simple**: Simple logos scale better
2. **Use vector source**: Convert SVG to PNG for best quality
3. **Test both themes**: Verify visibility in light and dark modes
4. **Optimize file size**: Use compression tools like TinyPNG
5. **Maintain aspect ratio**: 4:1 or 5:1 width to height ratio
6. **Use transparency**: PNG with transparent background
7. **Consider mobile**: Logo should be recognizable at small sizes

### Favicon Best Practices

1. **Start large**: Create at 512×512px, let browsers scale down
2. **Simple design**: Complex designs don't work at 16×16px
3. **High contrast**: Use bold colors for visibility
4. **Test at small size**: View at 16×16px to ensure recognizability
5. **Use brand colors**: Match your brand identity
6. **Avoid text**: Text is hard to read at favicon size
7. **Square format**: Favicons are always square

---

## Database Schema

Settings are stored in the `site_settings` table with this structure:

```sql
-- Logo setting
{
  key: 'logo_url',
  value: '/mayobebroslogo.png'
}

-- Favicon setting
{
  key: 'favicon_url',
  value: '/mayobebrosfavicon.png'
}
```

### Direct Database Update (Advanced)

If you need to update settings directly in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Table Editor → `site_settings`
3. Find the row with `key = 'logo_url'`
4. Update the `value` column
5. Save changes
6. Website updates automatically

---

## Current Default Files

Your website currently uses:

- **Logo**: `/mayobebroslogo.png`
- **Favicon**: `/mayobebrosfavicon.png`

These files are included in your `/public/` directory and can be replaced at any time.

---

## Advanced: Custom Logo for Admin Portal

To use a different logo in the admin portal:

1. **Create separate setting** (optional):
   - Add a new row in `site_settings` table
   - Key: `admin_logo_url`
   - Value: path to admin logo

2. **Update AdminLayout component**:
   - Edit `src/components/admin/AdminLayout.tsx`
   - Change logo src to use `admin_logo_url` if it exists
   - Fall back to `logo_url` if not

---

## Testing Checklist

After updating logo and favicon:

- [ ] Logo appears in header (light mode)
- [ ] Logo appears in header (dark mode)
- [ ] Logo appears in footer
- [ ] Logo is properly sized (not stretched)
- [ ] Logo is visible in both themes
- [ ] Favicon appears in browser tab
- [ ] Favicon appears when bookmarking
- [ ] Favicon works on mobile device
- [ ] Logo scales properly on mobile
- [ ] Logo scales properly on tablet
- [ ] Logo scales properly on desktop
- [ ] Settings save correctly
- [ ] Changes persist after page refresh
- [ ] Changes work in all browsers (Chrome, Firefox, Safari)

---

## Examples

### Example 1: Standard Local Files

```
Settings:
- Logo URL: /mycompanylogo.png
- Favicon URL: /mycompanyfavicon.png

Files in /public/:
- mycompanylogo.png (240×60px, transparent background)
- mycompanyfavicon.png (512×512px)
```

### Example 2: External CDN

```
Settings:
- Logo URL: https://cdn.example.com/assets/logo.png
- Favicon URL: https://cdn.example.com/assets/favicon.ico

Benefits:
- Faster loading from CDN
- No rebuild needed for updates
- Same logo across multiple sites
```

### Example 3: Data URI (Small Logos)

```
Settings:
- Logo URL: data:image/png;base64,iVBORw0KG...
- Favicon URL: data:image/png;base64,iVBORw0KG...

Benefits:
- No external file dependency
- Embeds image data directly
- Fastest possible load time
```

---

## Support

If you're still having issues:

1. Check the browser console for errors (F12 → Console tab)
2. Verify Supabase connection is working
3. Check file permissions on uploaded files
4. Try uploading a different image format
5. Contact your site administrator
6. Refer to `CMS_CONFIGURATION.md` for detailed setup

---

**Last Updated**: 2026-02-11
**Version**: 1.0.0
