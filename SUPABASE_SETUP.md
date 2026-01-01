# Supabase Setup Guide - Quick Start

## Connection String yang Anda dapat:
```
postgresql://postgres.hfjfwvxzidnhdhkqnuai:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## Yang perlu dilakukan:

### 1. Ganti [YOUR-PASSWORD]
Ganti `[YOUR-PASSWORD]` dengan database password yang Anda buat saat setup Supabase project.

**Contoh:**
Jika password Anda adalah `MySecurePass123`, maka connection string menjadi:
```
postgresql://postgres.hfjfwvxzidnhdhkqnuai:MySecurePass123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

### 2. Connection Strings untuk .env

Anda butuh **DUA** connection strings:

**A. DATABASE_URL (untuk Prisma runtime - dengan pooler)**
```env
DATABASE_URL="postgresql://postgres.hfjfwvxzidnhdhkqnuai:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```
⚠️ Notice: Port **6543** dan tambahan parameters di akhir

**B. DIRECT_URL (untuk migrations/import - direct connection)**
```env
DIRECT_URL="postgresql://postgres.hfjfwvxzidnhdhkqnuai:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```
⚠️ Notice: Port **5432**

### 3. Update .env file

Buka file `.env` dan update dengan format ini:

```env
# Supabase Database - Pooler Connection (untuk runtime)
DATABASE_URL="postgresql://postgres.hfjfwvxzidnhdhkqnuai:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase Database - Direct Connection (untuk migrations)
DIRECT_URL="postgresql://postgres.hfjfwvxzidnhdhkqnuai:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-generate-new-one"
NEXTAUTH_URL="http://localhost:3000"
```

**Ganti `[YOUR-PASSWORD]` dengan password Supabase Anda!**

### 4. Generate NEXTAUTH_SECRET (jika belum)

Run command ini untuk generate secret baru:
```bash
openssl rand -base64 32
```

Copy output dan paste ke `NEXTAUTH_SECRET` di `.env`

---

## Next Steps After Update .env:

1. ✅ Create schema di Supabase (via SQL Editor)
2. ✅ Import data ke Supabase
3. ✅ Test aplikasi dengan Supabase connection
4. ✅ Deploy ke Vercel

---

**PENTING**: Jangan commit file `.env` ke Git! File ini sudah ada di `.gitignore`.

Konfirmasi setelah Anda update `.env` dengan password yang benar!
