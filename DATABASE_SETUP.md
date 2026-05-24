# Database Setup for Local Development

## Issues Fixed

1. ✅ **Frontend API URL** - Fixed in `artifacts/fresher-resume/src/App.tsx`
   - Added `setBaseUrl("http://localhost:8080")` for development mode
   - This ensures the frontend API calls go to the backend server on port 8080

2. ⏳ **Database Connection** - Needs PostgreSQL setup
   - Current: `.env` configured with local PostgreSQL at `localhost:5432`
   - Original issue: Was pointing to "helium" (Replit-specific hostname)

## Quick Start: Using Supabase (Free Cloud Database)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project (choose free tier)
4. Wait for project to initialize (~2 minutes)

### Step 2: Get Connection String
1. In Supabase dashboard, go to **Settings** → **Database**
2. Copy the **PostgreSQL Connection String** (URI format)
3. It should look like: `postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres`

### Step 3: Update .env
Replace the `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
```

### Step 4: Push Schema
```bash
pnpm --filter @workspace/db run push
```

### Step 5: Seed Data (Optional)
```bash
pnpm --filter @workspace/scripts run seed
```

### Step 6: Start Development Server
```bash
pnpm run dev
```

## Alternative: Local PostgreSQL on Windows

If you prefer local development:

1. **Install PostgreSQL** from https://www.postgresql.org/download/windows/
   - Download version 15 or higher
   - During installation, remember the password you set for `postgres` user

2. **Create Database**
   ```bash
   psql -U postgres -c "CREATE DATABASE heliumdb;"
   ```

3. **Update .env** (already done):
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/heliumdb?sslmode=disable
   ```
   Replace `password` with the password you set during PostgreSQL installation

4. **Push Schema**
   ```bash
   pnpm --filter @workspace/db run push
   ```

5. **Start Server**
   ```bash
   pnpm run dev
   ```

## What Works Now ✅

After setting up the database:
1. Navigate to http://localhost:5173/register
2. Fill in the registration form
3. Click "Create Free Account"
4. You should be redirected to /dashboard after successful registration
5. Test login at http://localhost:5173/login

## Testing Demo Account

After seed data:
- Email: `demo@fresherresume.com`
- Password: `demo123456`

## Troubleshooting

### Error: "getaddrinfo ENOTFOUND helium"
- Make sure `.env` has the correct DATABASE_URL
- For cloud: Check Supabase connection string
- For local: Check PostgreSQL is running

### Error: "relation 'users' does not exist"
- Run: `pnpm --filter @workspace/db run push`
- This creates all necessary tables

### Port Already in Use
```bash
# Kill existing Node processes
taskkill /F /IM node.exe
# Then restart: pnpm run dev
```
