# PostgreSQL Connection Troubleshooting

## Error P1010 - Authentication Failed

Koneksi ke PostgreSQL gagal dengan error P1010. Berikut langkah troubleshooting:

### 1. Verifikasi PostgreSQL Service
Pastikan PostgreSQL service sudah running:
- Windows: Cek di Services (services.msc) atau Task Manager
- Cari service bernama "postgresql-xxxx" 
- Status harus "Running"

### 2. Verifikasi Kredensial Database
File `.env` harus berisi connection string yang benar:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/laporanKeuangan"
```

Breakdown:
- **Username**: postgres (default PostgreSQL username)
- **Password**: root (sesuai konfirmasi Anda)
- **Host**: localhost
- **Port**: 5432 (default PostgreSQL port)
- **Database**: laporanKeuangan

### 3. Test Koneksi Manual
Test koneksi dengan salah satu cara:

**Via psql:**
```bash
psql -U postgres -d laporanKeuangan
# Akan minta password: root
```

**Via pgAdmin:**
- Buka pgAdmin
- Connect ke server PostgreSQL
- Cek apakah database laporanKeuangan muncul

### 4. Kemungkinan Masalah

**A. Password salah atau username bukan 'postgres'**
   - Jika username bukan 'postgres', update connection string
   - Jika password bukan 'root', update connection string

**B. PostgreSQL tidak accept password authentication**
   - Cek file `pg_hba.conf`
   - Pastikan ada baris: `host all all 127.0.0.1/32 md5` atau `scram-sha-256`

**C. Port berbeda**
   - Default PostgreSQL: 5432
   - Laragon PostgreSQL bisa jadi port berbeda
   - Cek di Laragon settings

### 5. Solusi Cepat
Jika menggunakan Laragon PostgreSQL, kredensial biasanya:
- Username: `postgres`
- Password: kosong atau `root` 
- Port: bisa 5432 atau port lain yang di-set Laragon

Coba connection string alternatif:
```env
# Jika password kosong
DATABASE_URL="postgresql://postgres@localhost:5432/laporanKeuangan"

# Jika port berbeda (misal 5433)
DATABASE_URL="postgresql://postgres:root@localhost:5433/laporanKeuangan"
```
