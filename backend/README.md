# Backend Structure - Taniku API

## Struktur Folder

```
backend/
├── config/                 # Konfigurasi aplikasi
│   ├── config.php         # Konfigurasi utama
│   └── database.php       # Konfigurasi database
├── auth/                  # Autentikasi
│   ├── login.php         # Endpoint login
│   └── register.php      # Endpoint register
├── api/                   # API endpoints
│   └── user.php          # User management API
├── database/              # Database related files
│   └── setup_database.sql # Database setup script
├── utils/                 # Utility functions
│   └── helpers.php       # Helper functions
├── .htaccess             # Apache configuration
└── index.php             # Main entry point

```

## Deskripsi Folder

### `/config`
Berisi file-file konfigurasi aplikasi:
- `config.php` - Konfigurasi utama yang menginclude semua file konfigurasi lainnya
- `database.php` - Konfigurasi koneksi database

### `/auth`
Berisi file-file yang berkaitan dengan autentikasi:
- `login.php` - Endpoint untuk login user
- `register.php` - Endpoint untuk registrasi user baru

### `/api`
Berisi file-file API endpoints:
- `user.php` - API untuk manajemen user (CRUD operations)

### `/database`
Berisi file-file yang berkaitan dengan database:
- `setup_database.sql` - Script untuk setup database dan tabel

### `/utils`
Berisi file-file utility dan helper functions:
- `helpers.php` - Fungsi-fungsi helper seperti CORS, JSON response, validasi, dll

## Cara Penggunaan

1. **Setup Database**: Jalankan script di `database/setup_database.sql`
2. **Konfigurasi**: Sesuaikan konfigurasi di `config/database.php`
3. **Testing**: Akses `http://localhost/backend/` untuk test API

## API Endpoints

- `GET /backend/` - Status API
- `POST /backend/register` - Registrasi user
- `POST /backend/login` - Login user
- `GET /backend/user` - Get user data

## Keuntungan Struktur Ini

1. **Organized**: File-file dikelompokkan berdasarkan fungsi
2. **Maintainable**: Mudah untuk maintenance dan debugging
3. **Scalable**: Mudah untuk menambah fitur baru
4. **Readable**: Struktur yang jelas dan mudah dipahami
5. **Reusable**: Fungsi-fungsi utility dapat digunakan kembali