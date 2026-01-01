# Langkah Selanjutnya: Create Schema & Import Data

## Opsi 1: Via Supabase SQL Editor (Paling Mudah)

### Step 1: Buka Supabase SQL Editor
1. Login ke https://app.supabase.com
2. Pilih project `laporan-keuangan` Anda
3. Di sidebar kiri, klik **SQL Editor** (icon ⚡)

### Step 2: Run Schema Creation
1. Click "New Query"
2. Buka file `prisma/create-schema-manual.sql` di VS Code
3. Copy **semua isi file** (Ctrl+A, Ctrl+C)
4. Paste di SQL Editor Supabase
5. Click "Run" atau tekan Ctrl+Enter
6. Wait for "Success. No rows returned"

### Step 3: Verify Tables Created
1. Di sidebar kiri, klik **Table Editor** (icon 📋)
2. Anda harus lihat tables:
   - users
   - transactions
   - monthly_analyses
   - yearly_analyses
   - audit_logs

✅ Jika semua table muncul, schema creation berhasil!

---

## Opsi 2: Via Prisma Push (Alternatif)

Jika prefer pakai Prisma:

```bash
# Update schema.prisma dulu (jika belum)
# Tambahkan directUrl di datasource

# Push schema ke Supabase
npx prisma db push
```

---

## Setelah Schema Dibuat: Import Data

Saya akan siapkan script import untuk Supabase. Tunggu konfirmasi Anda bahwa schema sudah berhasil dibuat!

**Konfirmasi:**
- [ ] Schema sudah dibuat via SQL Editor
- [ ] Semua 5 tables muncul di Table Editor

Beri tahu saya jika schema creation berhasil, lalu kita lanjut import data!
