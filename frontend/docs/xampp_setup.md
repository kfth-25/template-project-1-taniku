# Setup Laravel Backend dengan XAMPP

## Automated Setup (Recommended)

### Quick Setup
Jalankan script otomatis yang sudah disediakan:

1. **Setup Backend ke XAMPP:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File "c:\proyek\setup_xampp.ps1"
   ```

2. **Setup Laravel (setelah XAMPP running):**
   ```batch
   c:\proyek\xampp_laravel_setup.bat
   ```

3. **Test API:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File "c:\proyek\test_xampp_api.ps1"
   ```

## Manual Setup

### 1. Copy Backend ke XAMPP
```bash
# Copy seluruh folder backend ke C:\xampp\htdocs\tani-api
xcopy "c:\proyek\backend\*" "C:\xampp\htdocs\tani-api\" /E /H /Y
```

### 2. Start XAMPP Services
- Buka XAMPP Control Panel
- Start Apache dan MySQL

### 3. Buat Database
- Buka phpMyAdmin: http://localhost/phpmyadmin
- Buat database baru dengan nama: `taniku_db`

### 4. Konfigurasi Environment
Update file `.env` di `C:\xampp\htdocs\tani-api\.env`:

```env
APP_NAME="Taniku"
APP_URL=http://localhost/tani-api

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=taniku_db
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Generate Application Key
```bash
cd C:\xampp\htdocs\tani-api
php artisan key:generate
```

### 6. Run Migrations
```bash
php artisan migrate
```

### 7. Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## URLs dan Endpoints

### Backend URLs
- **Backend:** `http://localhost/tani-api/public`
- **API Base:** `http://localhost/tani-api/public/api`

### API Endpoints
- **Register:** `POST /api/register`
- **Login:** `POST /api/login`
- **Logout:** `POST /api/logout` (protected)
- **User:** `GET /api/user` (protected)
- **Refresh:** `POST /api/refresh` (protected)

## Frontend Configuration
Frontend sudah dikonfigurasi untuk menggunakan XAMPP:
- **API Base URL:** `http://localhost/tani-api/public/api`
- **App Name:** "Taniku"

## Testing API

### Manual Test dengan curl/PowerShell
```powershell
# Register
$registerData = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
    password_confirmation = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/tani-api/public/api/register" -Method POST -Body $registerData -ContentType "application/json"
```

### Automated Test
Gunakan script yang sudah disediakan:
```powershell
powershell -ExecutionPolicy Bypass -File "c:\proyek\test_xampp_api.ps1"
```

## Troubleshooting

### Common Issues
1. **404 Error:** Pastikan Apache sudah running dan file ada di `C:\xampp\htdocs\tani-api`
2. **Database Error:** Pastikan MySQL running dan database `taniku_db` sudah dibuat
3. **Permission Error:** Jalankan Command Prompt sebagai Administrator
4. **CORS Error:** Pastikan CORS sudah dikonfigurasi dengan benar

### File Locations
- **Backend:** `C:\xampp\htdocs\tani-api`
- **Frontend:** `c:\proyek\frontend`
- **Scripts:** `c:\proyek\*.ps1` dan `c:\proyek\*.bat`