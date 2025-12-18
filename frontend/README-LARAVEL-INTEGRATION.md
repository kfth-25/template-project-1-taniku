# Integrasi React dengan Laravel dan XAMPP

Dokumen ini menjelaskan cara menghubungkan aplikasi React dengan backend Laravel yang berjalan di XAMPP.

## Persiapan

1. **Instalasi Axios**
   
   Axios sudah diinstal di proyek ini. Jika belum, Anda dapat menginstalnya dengan perintah:
   ```bash
   npm install axios
   ```

2. **Konfigurasi Environment**
   
   Salin file `.env.example` menjadi `.env`:
   ```bash
   copy .env.example .env
   ```
   
   Sesuaikan nilai `VITE_API_BASE_URL` jika API Laravel Anda tidak berjalan di `http://localhost:8000/api`.

## Struktur Integrasi API

Proyek ini sudah dikonfigurasi untuk terhubung dengan Laravel API:

1. **Konfigurasi API** (`src/services/api.js`)
   - Mengatur instance axios dengan baseURL dan interceptors
   - Menangani token autentikasi dan error response

2. **Service Produk** (`src/services/produkService.js`)
   - Menyediakan fungsi-fungsi untuk mengakses API produk
   - Termasuk operasi CRUD (Create, Read, Update, Delete)

3. **Komponen ProdukDisplay** (`src/components/ProdukDisplay/ProdukDisplay.jsx`)
   - Contoh penggunaan service API dalam komponen React
   - Menampilkan data produk dari API atau data statis

## Mengaktifkan Integrasi API

Untuk mengaktifkan pengambilan data dari API Laravel:

1. Pastikan server Laravel berjalan di XAMPP
2. Buka file `src/components/ProdukDisplay/ProdukDisplay.jsx`
3. Uncomment baris berikut:
   ```jsx
   // const data = await produkService.getAllProduk();
   // setProdukFromApi(data);
   ```

## Panduan Lengkap

Untuk panduan lengkap tentang cara mengatur Laravel dengan XAMPP dan membuat API, lihat dokumen:

[Panduan Menghubungkan React dengan Laravel dan XAMPP](./docs/laravel_setup.md)