# Update .env untuk Laragon PostgreSQL

Berdasarkan screenshot Laragon, PostgreSQL running di port 5432.

**Update file `.env` dengan:**

```env
DATABASE_URL="postgresql://postgres:root@127.0.0.1:5432/laporanKeuangan?schema=public"
```

Gunakan `127.0.0.1` instead of `localhost` untuk Laragon compatibility.
