# Panduan Menghubungkan React dengan Laravel dan XAMPP

## 1. Mengatur CORS di Laravel

Untuk mengizinkan aplikasi React mengakses API Laravel, Anda perlu mengatur CORS (Cross-Origin Resource Sharing) di Laravel. Ikuti langkah-langkah berikut:

### Instalasi Package CORS di Laravel

```bash
composer require fruitcake/laravel-cors
```

### Konfigurasi CORS

1. Buka file `config/cors.php` di proyek Laravel Anda. Jika file tidak ada, buat file tersebut dengan konten berikut:

```php
<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5174'], // Sesuaikan dengan URL React Anda
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

2. Pastikan middleware CORS terdaftar di `app/Http/Kernel.php`:

```php
protected $middleware = [
    // ...
    \Fruitcake\Cors\HandleCors::class,
];
```

## 2. Mengatur XAMPP dan Laravel

### Instalasi XAMPP

1. Download dan install XAMPP dari [situs resmi](https://www.apachefriends.org/index.html)
2. Setelah instalasi, buka XAMPP Control Panel dan start modul Apache dan MySQL

### Mengatur Proyek Laravel di XAMPP

1. Buat atau pindahkan proyek Laravel Anda ke direktori `C:\xampp\htdocs\nama_proyek_laravel`

2. Konfigurasi database di file `.env` Laravel:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database
DB_USERNAME=root
DB_PASSWORD=
```

3. Buat database di phpMyAdmin:
   - Buka browser dan akses `http://localhost/phpmyadmin`
   - Buat database baru dengan nama yang sama dengan `DB_DATABASE` di file `.env`

4. Jalankan migrasi database:

```bash
cd C:\xampp\htdocs\nama_proyek_laravel
php artisan migrate
```

5. Jalankan server Laravel:

```bash
php artisan serve
```

Server Laravel akan berjalan di `http://localhost:8000`

## 3. Membuat API di Laravel

Berikut adalah contoh pembuatan API sederhana di Laravel untuk produk:

### Membuat Model dan Migration

```bash
php artisan make:model Produk -m
```

Edit file migrasi di `database/migrations/xxxx_create_produks_table.php`:

```php
public function up()
{
    Schema::create('produks', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description');
        $table->decimal('price', 10, 2);
        $table->string('image')->nullable();
        $table->string('category');
        $table->timestamps();
    });
}
```

### Membuat Controller

```bash
php artisan make:controller API/ProdukController --api
```

Edit file controller di `app/Http/Controllers/API/ProdukController.php`:

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use Illuminate\Http\Request;

class ProdukController extends Controller
{
    public function index()
    {
        $produks = Produk::all();
        return response()->json($produks);
    }

    public function show($id)
    {
        $produk = Produk::findOrFail($id);
        return response()->json($produk);
    }

    public function getByCategory($category)
    {
        $produks = Produk::where('category', $category)->get();
        return response()->json($produks);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric',
            'image' => 'nullable|string',
            'category' => 'required|string',
        ]);

        $produk = Produk::create($validatedData);
        return response()->json($produk, 201);
    }

    public function update(Request $request, $id)
    {
        $produk = Produk::findOrFail($id);

        $validatedData = $request->validate([
            'name' => 'string|max:255',
            'description' => 'string',
            'price' => 'numeric',
            'image' => 'nullable|string',
            'category' => 'string',
        ]);

        $produk->update($validatedData);
        return response()->json($produk);
    }

    public function destroy($id)
    {
        $produk = Produk::findOrFail($id);
        $produk->delete();
        return response()->json(null, 204);
    }
}
```

### Mendefinisikan Routes API

Edit file `routes/api.php`:

```php
use App\Http\Controllers\API\ProdukController;
use Illuminate\Support\Facades\Route;

Route::get('/produk', [ProdukController::class, 'index']);
Route::get('/produk/{id}', [ProdukController::class, 'show']);
Route::get('/produk/category/{category}', [ProdukController::class, 'getByCategory']);
Route::post('/produk', [ProdukController::class, 'store']);
Route::put('/produk/{id}', [ProdukController::class, 'update']);
Route::delete('/produk/{id}', [ProdukController::class, 'destroy']);
```

## 4. Menggunakan API di React

Di aplikasi React, Anda sudah memiliki konfigurasi yang diperlukan:

1. File `src/services/api.js` untuk konfigurasi axios
2. File `src/services/produkService.js` untuk layanan API produk
3. Komponen `src/components/ProdukDisplay/ProdukDisplay.jsx` yang menggunakan layanan API

Untuk mengaktifkan penggunaan API, buka file `src/components/ProdukDisplay/ProdukDisplay.jsx` dan uncomment baris berikut:

```jsx
// const data = await produkService.getAllProduk();
// setProdukFromApi(data);
```

Menjadi:

```jsx
const data = await produkService.getAllProduk();
setProdukFromApi(data);
```

## 5. Menjalankan Aplikasi

1. Pastikan server Laravel berjalan:
```bash
cd C:\xampp\htdocs\nama_proyek_laravel
php artisan serve
```

2. Jalankan aplikasi React:
```bash
cd C:\proyek\frontend
npm run dev
```

Aplikasi React akan berjalan di `http://localhost:5174` dan akan terhubung ke API Laravel di `http://localhost:8000/api`.