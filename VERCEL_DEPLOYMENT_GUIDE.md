# Vercel Deployment Guide - Fix "Invalid API Key" Error

## Problem
The "Invalid API key" error appears on your login page because environment variables from your `.env` file are not automatically deployed to Vercel. Environment variables must be configured in Vercel's dashboard.

## Solution: Add Environment Variables to Vercel

### Step 1: Access Your Vercel Project Settings
1. Go to [https://vercel.com](https://vercel.com) and log in
2. Select your **mayobe-bros** project
3. Click on **Settings** (top navigation)
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Required Environment Variables

Add these two environment variables exactly as shown:

#### Variable 1: VITE_SUPABASE_URL
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://wcpfrqionikvvovjeknq.supabase.co`
- **Environment:** Select all environments (Production, Preview, Development)

#### Variable 2: VITE_SUPABASE_ANON_KEY
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGZycWlvbmlrdnZvdmpla25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODY3NDIsImV4cCI6MjA4NjM2Mjc0Mn0.nLhq4qbltIm9E_DBs3ZbzFrMS9ylGnradDKXlQLRFP4`
- **Environment:** Select all environments (Production, Preview, Development)

### Step 3: Redeploy Your Site
After adding the environment variables:
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the three dots menu (...) on the right
4. Click **Redeploy**
5. Confirm the redeployment

### Step 4: Verify the Fix
1. Wait for the deployment to complete (usually 1-2 minutes)
2. Visit your site at **www.mayobebros.com**
3. Go to the login page at **www.mayobebros.com/admin/login**
4. The "Invalid API key" error should now be resolved

## Important Notes

- Environment variables are NOT deployed from your `.env` file for security reasons
- You must add them manually in Vercel's dashboard
- Changes to environment variables require a redeployment to take effect
- Never share these values publicly or commit them to a public repository

## Troubleshooting

### If the error persists after redeployment:
1. Double-check that both variables are spelled exactly as shown (including `VITE_` prefix)
2. Verify there are no extra spaces in the variable names or values
3. Make sure you selected all environments when adding the variables
4. Clear your browser cache or try in an incognito/private window

### Need Help?
If you continue to experience issues, contact Vercel support or check the deployment logs in your Vercel dashboard for more details.
