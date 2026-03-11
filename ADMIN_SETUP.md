# Admin Setup Guide

## Setting Up the Admin User

To set up the admin account for accessing the Mayobe Bros Admin Portal, follow these steps:

### 1. Create Admin User in Supabase

You need to create an admin user in your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Users** in the left sidebar
4. Click **Add User** button
5. Enter the following details:
   - **Email**: `mbagamclean@gmail.com`
   - **Password**: `mambo dagas`
6. Click **Create User**

### 2. Access the Admin Portal

Once the user is created, you can access the admin portal at:

**Local Development:**
```
http://localhost:5173/admin/login
```

**Production:**
```
https://mayobebros.com/admin/login
```

### 3. Login Credentials

- **Email**: mbagamclean@gmail.com
- **Password**: mambo dagas

### 4. Staff Login Link

A "Staff Login" link is available in the website footer for easy access to the admin portal.

## Admin Portal Features

The admin portal provides access to:

- **Dashboard**: Overview statistics including total posts, views, comments, and reactions
- **Post Management**: Create, edit, and publish posts
- **Comment Moderation**: Manage user comments
- **Site Settings**: Configure website settings

## Security Notes

1. **Change the default password** immediately after first login
2. The admin portal is protected by Supabase authentication
3. Only authenticated users can access admin routes
4. Unauthorized access attempts will redirect to the login page

## Adding Additional Admins

To add more admin users:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter the new admin's email and password
4. Click "Create User"

All authenticated users will have access to the admin portal. For role-based access control, you would need to implement additional authorization logic.

## Troubleshooting

### Cannot Login
- Verify the user exists in Supabase Authentication
- Check that email and password are correct
- Ensure Supabase environment variables are set correctly in `.env`

### Redirected to Login Page
- Your session may have expired
- Clear browser cookies and try again
- Check browser console for any authentication errors

### Missing Admin Features
- Ensure you're on the `/admin/dashboard` route
- Check that you're logged in with a valid admin account
