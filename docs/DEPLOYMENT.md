# Deployment Guide

## Overview

This guide covers deploying the Family Tree application to production using free hosting services.

---

## Prerequisites

- GitHub account
- Supabase account (free tier)
- Vercel account (free tier) or Render account (free tier)
- Domain name (optional)

---

## Part 1: Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New Project"
5. Fill in:
   - Name: `family-tree-prod`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### 2. Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Run the migration files in order:
   ```sql
   -- Run each file from server/sql-prompts/ in order:
   -- 1. initial_schema.sql
   -- 2. phase_h_migration.sql
   -- 3. Any other migration files
   ```

### 3. Set up Authentication

1. Go to Authentication → Providers
2. Enable Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://<your-project>.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
3. Enable Email (Magic Links):
   - Already enabled by default
   - Configure email templates if needed

### 4. Configure Row Level Security (RLS)

RLS policies should already be in your migration files. Verify:

1. Go to Database → Tables
2. Check each table has RLS enabled
3. Verify policies exist for:
   - `trees`: Owner/editor/viewer access
   - `persons`: Based on tree permissions
   - `relationships`: Based on tree permissions
   - `photos`: Based on tree permissions

### 5. Get Environment Variables

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `SUPABASE_URL`
   - **anon public**: `SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Part 2: Backend Deployment (Render)

### 1. Prepare Backend

1. Ensure `server/package.json` has start script:
   ```json
   {
     "scripts": {
       "start": "node index.js"
     }
   }
   ```

2. Create `render.yaml` in project root:
   ```yaml
   services:
     - type: web
       name: family-tree-api
       env: node
       buildCommand: cd server && npm install
       startCommand: cd server && npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 3000
         - key: SUPABASE_URL
           sync: false
         - key: SUPABASE_ANON_KEY
           sync: false
         - key: SUPABASE_SERVICE_ROLE_KEY
           sync: false
   ```

### 2. Deploy to Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `family-tree-api`
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Instance Type: `Free`
5. Add environment variables:
   - `SUPABASE_URL`: From Supabase
   - `SUPABASE_ANON_KEY`: From Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: From Supabase (secret!)
   - `NODE_ENV`: `production`
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy the service URL (e.g., `https://family-tree-api.onrender.com`)

**Note:** Free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds.

---

## Part 3: Frontend Deployment (Vercel)

### 1. Prepare Frontend

1. Update `client/.env.production`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=https://family-tree-api.onrender.com
   VITE_USE_MOCK=false
   ```

2. Ensure `client/package.json` has build script:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: `Vite`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`: From Supabase
   - `VITE_SUPABASE_ANON_KEY`: From Supabase
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_USE_MOCK`: `false`
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Your app is live at `https://your-app.vercel.app`

### 3. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## Part 4: Post-Deployment Configuration

### 1. Update OAuth Redirect URIs

1. Go to Google Cloud Console
2. Update OAuth 2.0 credentials:
   - Add production URLs:
     - `https://your-app.vercel.app`
     - `https://your-project.supabase.co/auth/v1/callback`

### 2. Update Supabase Auth Settings

1. Go to Supabase → Authentication → URL Configuration
2. Set Site URL: `https://your-app.vercel.app`
3. Add Redirect URLs:
   - `https://your-app.vercel.app/**`

### 3. Test the Deployment

1. Visit your production URL
2. Test authentication (Google OAuth, Magic Link)
3. Create a test tree
4. Add test persons
5. Test all features:
   - Tree visualization
   - Timeline
   - Search
   - Photo upload
   - Data export
   - Sharing/invitations

---

## Part 5: Monitoring & Maintenance

### 1. Set Up Monitoring

**Vercel Analytics (Free):**
1. Go to Vercel project → Analytics
2. Enable Web Analytics
3. View real-time traffic and performance

**Render Logs:**
1. Go to Render dashboard → Your service
2. Click "Logs" to view real-time logs
3. Monitor for errors

**Supabase Monitoring:**
1. Go to Supabase → Database → Logs
2. Monitor query performance
3. Check for errors in Auth logs

### 2. Performance Optimization

**Enable Caching:**
```javascript
// In vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['reactflow', 'lucide-react'],
        }
      }
    }
  }
});
```

**Enable Compression:**
- Vercel automatically enables gzip/brotli
- Render automatically enables compression

### 3. Database Maintenance

**Regular Tasks:**
1. Monitor database size (Supabase free tier: 500MB)
2. Clean up old audit logs periodically
3. Optimize slow queries
4. Back up data regularly (use export feature)

**Indexing:**
```sql
-- Ensure these indexes exist
CREATE INDEX IF NOT EXISTS idx_persons_tree_id ON persons(tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_tree_id ON relationships(tree_id);
CREATE INDEX IF NOT EXISTS idx_photos_person_id ON photos(person_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
```

---

## Part 6: Scaling Considerations

### When to Upgrade

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth/month
- Upgrade when: Database >400MB or bandwidth >1.5GB/month
- Pro tier: $25/month (8GB database, 50GB bandwidth)

**Render:**
- Free tier: Spins down after 15min inactivity
- Upgrade when: Need always-on service or faster response
- Starter tier: $7/month (always-on, 512MB RAM)

**Vercel:**
- Free tier: 100GB bandwidth/month
- Upgrade when: Bandwidth >80GB/month
- Pro tier: $20/month (1TB bandwidth)

### Performance Tips

1. **Enable CDN caching** for static assets
2. **Implement pagination** for large datasets
3. **Use database connection pooling**
4. **Optimize images** (compress, WebP format)
5. **Lazy load** large components
6. **Monitor bundle size** (keep <500KB)

---

## Part 7: Backup & Recovery

### Automated Backups

**Supabase:**
- Free tier: Daily backups (7-day retention)
- Pro tier: Point-in-time recovery

**Manual Backups:**
1. Use data export feature regularly
2. Store exports in Google Drive or Dropbox
3. Test restore process periodically

### Disaster Recovery Plan

1. **Database failure:**
   - Restore from Supabase backup
   - Import from latest export

2. **Backend failure:**
   - Redeploy from GitHub
   - Render auto-deploys on push

3. **Frontend failure:**
   - Redeploy from GitHub
   - Vercel auto-deploys on push

---

## Part 8: Security Checklist

Before going live, verify:

- [ ] All environment variables are set correctly
- [ ] Service role key is kept secret (never in frontend)
- [ ] HTTPS is enabled (automatic with Vercel/Render)
- [ ] RLS policies are enabled on all tables
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] OAuth redirect URIs are whitelisted
- [ ] Error messages don't leak sensitive data
- [ ] Audit logging is enabled
- [ ] Input validation is working

---

## Part 9: Troubleshooting

### Common Issues

**Issue: "Failed to fetch" errors**
- Check API URL in environment variables
- Verify backend is running (check Render logs)
- Check CORS configuration

**Issue: Authentication not working**
- Verify OAuth credentials
- Check redirect URIs
- Verify Supabase auth settings

**Issue: Slow performance**
- Check Render service status (may be spinning up)
- Monitor database query performance
- Check network tab for large payloads

**Issue: Database connection errors**
- Check Supabase project status
- Verify connection string
- Check for connection limit (free tier: 60 connections)

---

## Part 10: Continuous Deployment

### Set Up Auto-Deploy

**Vercel:**
- Automatically deploys on push to main branch
- Preview deployments for pull requests

**Render:**
- Automatically deploys on push to main branch
- Configure in Render dashboard

### Deployment Workflow

1. Develop on feature branch
2. Create pull request
3. Review preview deployment (Vercel)
4. Merge to main
5. Auto-deploy to production
6. Monitor logs for errors
7. Test production deployment

---

## Support

**Issues?**
- Check logs: Vercel, Render, Supabase
- Review error messages
- Test in development first
- Contact support if needed

**Resources:**
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

## Estimated Costs

**Free Tier (Recommended for MVP):**
- Supabase: $0/month
- Render: $0/month (with spin-down)
- Vercel: $0/month
- **Total: $0/month**

**Paid Tier (For Production):**
- Supabase Pro: $25/month
- Render Starter: $7/month
- Vercel Pro: $20/month (optional)
- **Total: $32-52/month**

---

## Launch Checklist

- [ ] Database migrated and tested
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Authentication working (Google + Magic Link)
- [ ] All features tested in production
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security checklist completed
- [ ] Documentation updated
- [ ] Team trained on deployment process

**You're ready to launch! 🚀**
