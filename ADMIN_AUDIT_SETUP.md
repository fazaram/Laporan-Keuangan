# Admin-Only Audit Log Access - Setup Guide

## Ringkasan Perubahan

Audit log sekarang hanya bisa diakses oleh pengguna dengan role **ADMIN**. Perubahan ini mencakup:

1. **Database Schema**: Menambahkan field `role` pada tabel `users`
2. **Authentication**: Memperbarui NextAuth untuk menyertakan role dalam session
3. **API Protection**: Menambahkan pengecekan admin di semua endpoint audit log
4. **Admin Management**: Tools untuk mengelola role pengguna

---

## File yang Diubah

### 1. Database Schema
- **File**: `prisma/schema.prisma`
- **Perubahan**: 
  - Menambahkan field `role` pada model `User` (default: `USER`)
  - Menambahkan enum `UserRole` dengan nilai `USER` dan `ADMIN`

### 2. TypeScript Types
- **File**: `types/next-auth.d.ts`
- **Perubahan**: Menambahkan property `role` pada interface `User`, `Session`, dan `JWT`

### 3. Authentication
- **File**: `lib/auth.ts`
- **Perubahan**: Memperbarui callbacks untuk menyertakan `role` dalam JWT token dan session

### 4. API Routes - Audit Logs
Endpoint berikut sekarang memerlukan role ADMIN:

- **File**: `app/api/audit/route.ts`
  - Endpoint: `GET /api/audit`
  - Menampilkan semua audit logs dengan filtering

- **File**: `app/api/audit/transaction/[id]/route.ts`
  - Endpoint: `GET /api/audit/transaction/[id]`
  - Menampilkan audit logs untuk transaksi tertentu

Kedua endpoint akan mengembalikan **403 Forbidden** jika pengguna bukan admin.

### 5. Admin Management API (Baru)
- **File**: `app/api/admin/users/role/route.ts`
- **Endpoint**: `POST /api/admin/users/role`
- **Fungsi**: Mengubah role pengguna (hanya untuk admin)
- **Body Request**:
  ```json
  {
    "email": "user@example.com",
    "role": "ADMIN" // atau "USER"
  }
  ```

---

## Langkah-Langkah Setup

### Step 1: Restart Development Server

Karena ada perubahan pada Prisma schema, Anda perlu restart development server:

1. Stop server yang sedang berjalan (Ctrl+C)
2. Jalankan migrasi database:
   ```bash
   npx prisma db push
   ```
3. Start ulang server:
   ```bash
   npm run dev
   ```

### Step 2: Jalankan SQL Migration (Alternatif)

Jika `prisma db push` gagal, Anda bisa jalankan SQL secara manual:

1. Buka MySQL/phpMyAdmin
2. Jalankan SQL dari file `prisma/add_role_migration.sql`:
   ```sql
   ALTER TABLE users ADD COLUMN role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';
   ```
3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### Step 3: Promote User Menjadi Admin

Ada dua cara untuk membuat user admin:

#### Cara 1: Menggunakan Script TypeScript
```bash
npx tsx prisma/promote-admin.ts admin@example.com
```

#### Cara 2: Menggunakan SQL
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

#### Cara 3: Menggunakan API (setelah user pertama menjadi admin)
```bash
POST /api/admin/users/role
Content-Type: application/json

{
  "email": "newadmin@example.com",
  "role": "ADMIN"
}
```

---

## Testing

### 1. Test sebagai User Biasa

Login sebagai user biasa, lalu coba akses audit log:

```bash
GET /api/audit
```

**Expected Response**: `403 Forbidden`
```json
{
  "error": "Forbidden: Admin access required"
}
```

### 2. Test sebagai Admin

Login sebagai admin, lalu akses audit log:

```bash
GET /api/audit
```

**Expected Response**: `200 OK` dengan data audit logs

### 3. Test Get Transaction Audit Logs

```bash
GET /api/audit/transaction/[transaction-id]
```

Non-admin: `403 Forbidden`  
Admin: `200 OK` dengan audit logs

---

## Response Codes

| Code | Status | Keterangan |
|------|--------|-----------|
| 200 | OK | Request berhasil (admin) |
| 401 | Unauthorized | Belum login |
| 403 | Forbidden | Bukan admin |
| 404 | Not Found | Resource tidak ditemukan |
| 500 | Internal Server Error | Error server |

---

## Struktur Role

```typescript
enum UserRole {
  USER    // User biasa - tidak bisa akses audit log
  ADMIN   // Administrator - bisa akses audit log dan manage roles
}
```

---

## Security Notes

1. **Default Role**: Semua user baru otomatis mendapat role `USER`
2. **Admin Access**: Hanya admin yang bisa:
   - Melihat audit logs
   - Mengubah role user lain
3. **Session**: Role disimpan dalam JWT token dan divalidasi setiap request
4. **Database**: Role disimpan sebagai ENUM di MySQL untuk data integrity

---

## Troubleshooting

### Error: "Property 'role' does not exist"
- **Solusi**: Restart TypeScript server di VS Code
  - Tekan `Ctrl+Shift+P`
  - Ketik "TypeScript: Restart TS Server"

### Error: "Column 'role' doesn't exist"
- **Solusi**: Jalankan database migration
  ```bash
  npx prisma db push
  ```

### Tidak bisa generate Prisma client
- **Solusi**: Stop development server terlebih dahulu
  ```bash
  # Stop server with Ctrl+C
  npx prisma generate
  npm run dev
  ```

---

## API Endpoint Summary

| Endpoint | Method | Access | Deskripsi |
|----------|--------|--------|-----------|
| `/api/audit` | GET | Admin only | Get all audit logs |
| `/api/audit/transaction/[id]` | GET | Admin only | Get transaction audit logs |
| `/api/admin/users/role` | POST | Admin only | Update user role |

---

## Next Steps

1. ✅ Stop development server
2. ✅ Jalankan `npx prisma db push`
3. ✅ Start ulang server
4. ✅ Promote minimal 1 user menjadi admin
5. ✅ Test akses audit log sebagai admin dan non-admin
