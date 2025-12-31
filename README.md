# 💰 Laporan Keuangan - Sistem Manajemen Keuangan Pribadi

Aplikasi web modern untuk mengelola keuangan pribadi dengan analisis mendalam, laporan bulanan/tahunan, dan audit trail yang komprehensif.

## ✨ Features

### 📊 Dashboard
- KPI cards dengan metrik real-time (Pemasukan, Pengeluaran, Saldo)
- Perbandingan month-over-month
- Quick actions untuk transaksi dan laporan
- Daftar transaksi terbaru
- Data agregasi berdasarkan role user

### 💳 Manajemen Transaksi
- CRUD operations untuk income dan expense
- Kategorisasi transaksi
- Filter dan pencarian
- Audit trail otomatis untuk setiap perubahan

### 📈 Laporan Keuangan
- **Laporan Bulanan**: Analisis per bulan dengan grafik dan breakdown kategori
- **Laporan Tahunan**: Overview tahunan dengan trend analysis
- Export ke Excel dengan embedded charts
- Perbandingan periode (MoM, YoY)

### 🔍 Audit Log
- Tracking lengkap semua aktivitas user
- Filter berdasarkan action type, entity, dan tanggal
- Visibility berdasarkan role (VIEWER dan ADMIN)

### 🔐 Role-Based Access Control
- **VIEWER**: Read-only access untuk monitoring dan audit
  - Dapat melihat semua data dari semua user
  - Tidak dapat create/update/delete transaksi
  - Akses penuh ke audit log
- **USER**: Standard user dengan CRUD pada data sendiri
  - Kelola transaksi pribadi
  - Akses laporan pribadi
  - Tidak dapat akses audit log
- **ADMIN**: Full administrative access
  - Kelola transaksi pribadi
  - Akses penuh ke audit log
  - Manajemen user roles

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js
- **Database**: MySQL with Prisma ORM
- **Charts**: Chart.js with react-chartjs-2
- **Excel Export**: ExcelJS
- **UI Components**: Custom components dengan modern design

## 📋 Prerequisites

- Node.js 18+ dan npm/yarn
- MySQL 8.0+
- Git

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd laporan-keuangan
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Buat file `.env` di root project:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/laporan_keuangan"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-min-32-characters"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database dengan demo users
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Aplikasi akan running di [http://localhost:3000](http://localhost:3000)

## 👥 Default User Credentials

Setelah seeding database, gunakan kredensial berikut:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| ADMIN | admin@laporan.com | admin123 | Full administrative access |
| USER | user@laporan.com | user123 | Standard user access |
| VIEWER | viewer@laporan.com | viewer123 | Read-only monitoring access |

## 📁 Project Structure

```
laporan-keuangan/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── transactions/     # Transaction CRUD
│   │   ├── reports/          # Monthly & Yearly reports
│   │   ├── audit/            # Audit log endpoints
│   │   └── export/           # Excel export
│   ├── dashboard/            # Dashboard page
│   ├── transactions/         # Transaction management
│   ├── reports/              # Report pages
│   ├── audit/                # Audit log page
│   └── login/                # Login page
├── components/               # Reusable components
│   ├── Navbar.tsx            # Navigation bar
│   ├── KPICard.tsx           # Dashboard KPI cards
│   └── charts/               # Chart components
├── lib/                      # Utilities & services
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Prisma client
│   ├── permissions.ts        # Role-based permissions
│   ├── reports/              # Report generation services
│   ├── analysis/             # Financial analysis engine
│   └── audit/                # Audit logging service
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
└── types/                    # TypeScript type definitions
```

## 🔑 Permission Matrix

| Feature | VIEWER | USER | ADMIN |
|---------|--------|------|-------|
| **Dashboard** |
| View transactions | ✅ All users | ✅ Own only | ✅ Own only |
| KPI metrics | ✅ Aggregated | ✅ Own only | ✅ Own only |
| **Transactions** |
| View list | ✅ All users | ✅ Own only | ✅ Own only |
| Create | ❌ | ✅ | ✅ |
| Edit | ❌ | ✅ | ✅ |
| Delete | ❌ | ✅ | ✅ |
| **Reports** |
| Monthly/Yearly | ✅ All data | ✅ Own only | ✅ Own only |
| Export Excel | ✅ All data | ✅ Own only | ✅ Own only |
| **Audit Log** |
| View | ✅ All users | ❌ | ✅ All users |

## 🗄️ Database Schema

### User
- id, name, email, password, role (VIEWER/USER/ADMIN)

### Transaction
- id, userId, date, category, amount, type (INCOME/EXPENSE), description

### AuditLog
- id, userId, action, entityType, entityId, changes, ipAddress, userAgent

### MonthlyAnalysis & YearlyAnalysis
- Auto-generated reports dengan analisis finansial

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Transactions
- `GET /api/transactions` - List transactions (filtered by role)
- `POST /api/transactions` - Create transaction (USER, ADMIN)
- `PUT /api/transactions/:id` - Update transaction (USER, ADMIN)
- `DELETE /api/transactions/:id` - Delete transaction (USER, ADMIN)

### Reports
- `GET /api/reports/monthly?year=2026&month=1` - Monthly report
- `GET /api/reports/yearly?year=2026` - Yearly report
- `GET /api/export/monthly?year=2026&month=1` - Export monthly to Excel
- `GET /api/export/yearly?year=2026` - Export yearly to Excel

### Audit
- `GET /api/audit` - List audit logs (VIEWER, ADMIN)
- `GET /api/audit/transaction/:id` - Transaction specific logs

## 🎨 Features Highlights

### Multi-Layer Security
1. **API Protection**: Role-based validation pada setiap endpoint
2. **UI Protection**: Conditional rendering berdasarkan role
3. **Middleware Protection**: Session validation dan route guards

### Shared Data View (VIEWER Role)
VIEWER role dirancang khusus untuk auditor/supervisor dengan kemampuan:
- Melihat semua transaksi dari semua user
- Dashboard agregasi dari seluruh organisasi
- Laporan bulanan/tahunan komprehensif
- Audit trail lengkap
- Tetap read-only untuk menjaga integritas data

### Financial Analysis
- Automatic trend analysis
- Category breakdown dengan persentase
- Month-over-month dan year-over-year comparisons
- AI-powered recommendations

## 🔧 Development

### Database Commands

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Build for Production

```bash
# Build aplikasi
npm run build

# Start production server
npm start
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | MySQL connection string | mysql://user:pass@localhost:3306/db |
| NEXTAUTH_URL | Application URL | http://localhost:3000 |
| NEXTAUTH_SECRET | Secret key untuk JWT | min 32 random characters |

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check MySQL status
mysql --version

# Test database connection
mysql -u username -p

# Verify DATABASE_URL format
# mysql://username:password@host:port/database
```

### Prisma Client Error
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset and reseed database
npx prisma migrate reset
```

### Styling Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🙏 Credits

Built with ❤️ using modern web technologies.

## 📄 License

MIT License - feel free to use this project for learning and development.

---

**Version**: 1.0.0  
**Last Updated**: January 2026
#   L a p o r a n - K e u a n g a n  
 