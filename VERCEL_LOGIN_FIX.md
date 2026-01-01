# Vercel Login Stuck/Redirect Loop - Troubleshooting

## Kemungkinan Penyebab:

### 1. NEXTAUTH_URL Tidak Match
**Paling umum!** NEXTAUTH_URL harus EXACT sama dengan production URL.

**Check:**
- Vercel project URL: `https://your-app.vercel.app`
- NEXTAUTH_URL di Vercel env vars: Harus SAMA PERSIS
- ❌ SALAH: `http://localhost:3000` (masih dev URL)
- ❌ SALAH: `https://your-app.vercel.app/` (ada trailing slash)
- ✅ BENAR: `https://your-app.vercel.app`

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Edit `NEXTAUTH_URL`
3. Set ke production URL tanpa trailing slash
4. Redeploy

---

### 2. NEXTAUTH_SECRET Tidak Di-Set
NextAuth butuh secret key untuk JWT signing.

**Check:**
- Apakah `NEXTAUTH_SECRET` ada di Vercel environment variables?

**Fix:**
1. Generate: `openssl rand -base64 32`
2. Add di Vercel environment variables
3. Redeploy

---

### 3. DATABASE_URL Issue
Database connection error bisa cause login fail.

**Check Vercel Logs:**
- Vercel Dashboard → Deployments → [Your deployment] → Runtime Logs
- Cari error message terkait database

**Common issues:**
- Connection string salah
- Supabase database tidak accessible
- Connection limit exceeded

---

### 4. Session Cookie Domain Issue
Browser mungkin reject cookies.

**Check:**
- Apakah Vercel domain menggunakan HTTPS? (harus)
- Browser console ada warning tentang cookies?

---

## Quick Fix Checklist:

```
[ ] Verify NEXTAUTH_URL = production URL (exact match, no trailing slash)
[ ] Verify NEXTAUTH_SECRET ter-set di Vercel
[ ] Verify DATABASE_URL benar
[ ] Check Vercel runtime logs untuk error
[ ] Clear browser cookies dan coba lagi
[ ] Try incognito/private mode
```

---

## Steps untuk Debug:

### 1. Check Environment Variables
Vercel → Settings → Environment Variables

Must have:
- `DATABASE_URL` ✅
- `NEXTAUTH_URL` ❓
- `NEXTAUTH_SECRET` ❓
- `DIRECT_URL` (optional)

### 2. Check Runtime Logs
Vercel → Deployments → Latest → Runtime Logs

Look for:
- NextAuth errors
- Database connection errors
- JWT signing errors

### 3. Test dalam Incognito
Kadang browser cookie conflicts

### 4. Check Console
Browser DevTools → Console
Look for redirect loop warnings atau CORS errors

---

## Most Likely Fix:

1. **Update NEXTAUTH_URL di Vercel:**
   ```
   Settings → Environment Variables → Edit NEXTAUTH_URL
   Value: https://[your-actual-vercel-url].vercel.app
   ```

2. **Redeploy:**
   ```
   Deployments → [...] → Redeploy
   ```

3. **Clear cookies & test lagi**

---

Beri tahu saya:
1. Apa production URL Vercel Anda?
2. Apakah NEXTAUTH_URL di Vercel sudah di-set?
3. Ada error message di browser console?
