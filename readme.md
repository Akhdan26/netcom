# Netcom Technical Assessment - Senior Software Engineer

Aplikasi E-Commerce Analytics & Operational Dashboard berbasis **Laravel 11 (Backend REST API dengan Service-Repository Pattern)** dan **React 19 (Frontend SPA dengan Tailwind CSS v4, TanStack Query, & Recharts)**. Menggunakan dataset publik Brazilian E-Commerce (Olist) berukuran >1,5 juta baris data.

---

## 🚀 Fitur Utama (Point A)

1. **Dashboard Login & Autentikasi:** Autentikasi aman berbasis token menggunakan Laravel Sanctum dengan auto-logout (401 handler).
2. **Grafik Revenue Harian (Bulan & Tahun):** Visualisasi interaktif tren total penjualan harian dengan pengisian tanggal kosong otomatis (*date-zero-filling*).
3. **Deteksi Anomali Revenue Harian:** Pendekatan statistik menggunakan metode **Interquartile Range (IQR 1.5x)** dan **Z-Score** untuk mendeteksi lonjakan ekstrem (*e.g., Black Friday 24 Nov 2017*) maupun penurunan signifikan.
4. **Antrean Pesanan Belum Dikirim (*Pending Shipments*):** Monitoring pesanan yang belum diserahkan ke kurir logistik (`order_delivered_carrier_date IS NULL`) lengkap dengan pencarian dan filter status.
5. **Dynamic Dataset Explorer & CRUD:** Fitur penjelajah data dinamis untuk seluruh 9 tabel dataset Olist dengan pencarian global, pagination, dan operasi CRUD.

---

## 🛠️ Tech Stack & Arsitektur

- **Backend:** Laravel 11, PHP 8.2+, Laravel Sanctum
- **Frontend:** React 19, Vite, Tailwind CSS v4, TanStack Query v5, Recharts, Lucide Icons
- **Database:** MySQL 8.0 / MariaDB
- **Pola Desain:** *Service Layer Pattern* (Controller tipis mendelegasikan logika analitik dan data ke `RevenueAnalyticsService`, `AnomalyDetectionService`, `OrderService`, dan `DatasetService`).

---

## ⚙️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat
- PHP >= 8.2 & Composer
- Node.js >= 18 & NPM
- MySQL >= 8.0

### 2. Setup Backend (Laravel)
```bash
cd backend

# 1. Salin konfigurasi environment
cp .env.example .env

# 2. Sesuaikan konfigurasi database di .env (DB_DATABASE=netcom_ecommerce)
# Buat database kosong netcom_ecommerce di MySQL lokal Anda

# 3. Generate app key
php artisan key:generate

# 4. Jalankan migrasi tabel
php artisan migrate

# 5. Import 1,5 juta data Olist (Stream Batch Ingestion)
php artisan datasets:import

# 6. Buat akun admin default
php artisan db:seed

# 7. Jalankan server backend
php artisan serve
```
Backend akan aktif di `http://127.0.0.1:8000`.

### 3. Setup Frontend (React)
```bash
cd ../frontend

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Jalankan frontend development server
npm run dev
```
Buka browser Anda ke `http://localhost:5173`.

---

## 🔑 Kredensial Login Dashboard

- **Email:** `admin@netcom.com`
- **Password:** `password123`

---

## 📊 Entity Relationship Diagram (Point B)

Diagram relasi database tersedia dalam resolusi tinggi di:
📁 **`image/erd.png`**

Dump database yang telah dikompresi tersedia di:
📁 **`dump/netcom_ecommerce.sql.gz`**

---

## 💡 Analytical & Operation Skills (Point C)

> **Pertanyaan:** *Apa yang Anda akan lakukan apabila data kian membesar ratusan kali lipat dan user yang terus bertambah hingga aplikasi diakses oleh ratusan orang dalam satu waktu dalam meningkatkan/menjaga performa aplikasi?*

### 1. Root Cause & Problem Analysis
Pada volume data puluhan juta baris dengan ratusan user konkuren (~50–200 QPS), bottleneck terbesar **bukan di CPU web server**, melainkan pada **I/O Database akibat query agregasi analitik**:
- Menjalankan `SUM()`, `COUNT()`, dan `GROUP BY DATE` berulang-ulang di tabel transaksi besar akan membebani IOPS database dan menyebabkan *table lock*.
- Mayoritas user di dashboard analitik mengakses rentang data periode yang sama secara bersamaan (misal: memantau laporan bulan tertentu).

---

### 2. Strategi Solusi Pragmatis (Pragmatic Engineering)

#### A. Pre-Aggregated Summary Table (Data Rollup) — *Dampak Paling Masif*
Data transaksi lampau (misal: data tahun 2017) bersifat **historis dan tidak pernah berubah (*immutable*)**. Menghitung ulang jutaan baris setiap kali dashboard dibuka adalah inefisiensi arsitektur.
- **Solusi:** Buat tabel rekapitulasi harian `daily_revenue_summaries`.
- Jalankan scheduled job (cron) di latar belakang setiap malam untuk mengagregasi data transaksi hari berjalan.
- Query dashboard hanya perlu membaca ~30 baris dari tabel rekap (bukan memindai jutaan baris transaksi mentah), memangkas waktu respons dari **~5–8 detik menjadi <5 milidetik**.

#### B. Caching Berjenjang di Service Layer (Redis)
- Hasil kalkulasi endpoint analitik di-cache di Redis menggunakan pola `Cache::remember('revenue:2017:11', 3600, ...)`.
- Ketika 100 user membuka dashboard secara bersamaan, **hanya request pertama yang menyentuh database**, sementara 99 user lainnya langsung dilayani dari memory RAM Redis dengan latensi mikrodetik.
- Caching pada data hari ini menggunakan TTL pendek (5–15 menit) atau *event-driven cache invalidation* saat ada transaksi baru.

#### C. Pemisahan Beban Service & Read-Replicas
- **Pemisahan Baca & Tulis (Read-Write Splitting):** Menggunakan konfigurasi native Laravel (`read` & `write` connection di `config/database.php`). Operasi tulis transaksi baru diarahkan ke *Primary Database*, sedangkan query dashboard dan pelaporan diarahkan ke *Read Replica*, sehingga analitik tidak pernah mengganggu antrean checkout/order.
- **Asynchronous Worker:** Proses berat seperti import massal dataset, ekspor laporan ke Excel/PDF, atau kalkulasi anomali periodik dialihkan sepenuhnya ke background queue worker (Laravel Queue), menjaga thread HTTP request tetap ringan dan responsif.
