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
📁 **`dump/netcom_dump.sql.gz`**

---

## 💡 Analytical & Operation Skills (Point C)

> **Pertanyaan:** *Apa yang Anda akan lakukan apabila data kian membesar ratusan kali lipat dan user yang terus bertambah hingga aplikasi diakses oleh ratusan orang dalam satu waktu dalam meningkatkan/menjaga performa aplikasi?*

Berikut adalah arsitektur strategi skala besar (*High Scalability Architecture*) yang akan diterapkan:

### 1. Database Tier: Read/Write Splitting & Partitioning
- **Pemisahan Read/Write (Replication):** Membagi beban transaksi. Operasi tulis (transaksi baru, CRUD) diarahkan ke *Primary/Master Database*, sedangkan beban pembacaan analitik (Dashboard, Grafik Revenue) diarahkan ke sekumpulan *Read Replicas* menggunakan konfigurasi bawaan Laravel (`read` & `write` connection).
- **Table Partitioning:** Tabel transaksi historis seperti `orders` dan `order_payments` dipartisi berdasarkan tahun transaksi (`PARTITION BY RANGE (YEAR(order_purchase_timestamp))`). Hal ini mencegah full table scan saat query hanya membutuhkan data periode tertentu.
- **Dedicated OLAP / Data Warehouse:** Jika data mencapai puluhan juta baris, beban agregasi analitik dialihkan dari MySQL (OLTP) ke database kolumnar seperti **ClickHouse** atau **Google BigQuery** melalui proses Change Data Capture (CDC) Debezium/Kafka.

### 2. Multi-Tier Caching Strategy
- **Application Caching (Redis):** Data agregasi revenue historis (bulan/tahun yang sudah berlalu) bersifat *immutable* (tidak berubah). Hasil agregasi di-cache di Redis dengan TTL panjang.
- **Event-Driven Cache Invalidation:** Menggunakan Laravel Cache Tags. Jika ada pembaruan transaksi pada bulan berjalan, sistem secara otomatis hanya menghapus cache untuk bulan tersebut.
- **Edge Caching (CDN):** Menempatkan Cloudflare CDN di depan API untuk melakukan caching HTTP (`Cache-Control: public, max-age=300`) pada endpoint agregasi publik.

### 3. Application Tier & Concurrency Handling
- **Stateless Application & Auto-Scaling:** Memastikan seluruh instance backend Laravel bersifat *stateless* (session dan cache berada di Redis, media file di AWS S3) sehingga backend dapat di-scale horizontal di Kubernetes / AWS ECS di balik Application Load Balancer (ALB).
- **Database Connection Pooling:** Mengimplementasikan **ProxySQL** di antara server aplikasi dan database untuk mencegah kehabisan koneksi (*connection exhaustion*) saat ratusan user mengakses secara bersamaan.
- **Asynchronous Queue Processing:** Proses berat seperti import batch, generate laporan PDF/Excel, atau kalkulasi anomali periodik dialihkan ke background worker menggunakan **Laravel Horizon (Redis Queue)**.
