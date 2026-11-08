<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportDatasets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'datasets:import {path? : Path folder dataset}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import 9 Olist CSV datasets into MySQL using high-performance stream batching';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Path default mengarah ke folder dataset_technical_test_netcom di root proyek
        $basePath = $this->argument('path') ?? base_path('../dataset_technical_test_netcom');
        if (!is_dir($basePath)) {
            $this->error("Folder dataset tidak ditemukan di: {$basePath}");
            return 1;
        }
        $this->info("=== MEMULAI IMPORT DATASET OLIST ===");
        $startTime = microtime(true);
        // Optimasi: Tingkatkan limit memori & matikan query logging Laravel
        ini_set('memory_limit', '512M');
        set_time_limit(0);
        DB::connection()->disableQueryLog();
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        try {
            // 1. Kategori & Handle 2 Kategori Missing
            $this->importCategories($basePath . '/product_category_name_translation.csv');
            // 2. Customers (~99k baris)
            $this->fastBatchImport(
                $basePath . '/olist_customers_dataset.csv',
                'customers',
                ['customer_id', 'customer_unique_id', 'customer_zip_code_prefix', 'customer_city', 'customer_state'],
                2500
            );
            // 3. Sellers (~3k baris)
            $this->fastBatchImport(
                $basePath . '/olist_sellers_dataset.csv',
                'sellers',
                ['seller_id', 'seller_zip_code_prefix', 'seller_city', 'seller_state'],
                1000
            );
            // 4. Products (~32k baris)
            $this->fastBatchImport(
                $basePath . '/olist_products_dataset.csv',
                'products',
                [
                    'product_id',
                    'product_category_name',
                    'product_name_lenght',
                    'product_description_lenght',
                    'product_photos_qty',
                    'product_weight_g',
                    'product_length_cm',
                    'product_height_cm',
                    'product_width_cm'
                ],
                2500
            );
            // 5. Orders (~99k baris)
            $this->fastBatchImport(
                $basePath . '/olist_orders_dataset.csv',
                'orders',
                [
                    'order_id',
                    'customer_id',
                    'order_status',
                    'order_purchase_timestamp',
                    'order_approved_at',
                    'order_delivered_carrier_date',
                    'order_delivered_customer_date',
                    'order_estimated_delivery_date'
                ],
                2500
            );
            // 6. Order Items (~112k baris)
            $this->fastBatchImport(
                $basePath . '/olist_order_items_dataset.csv',
                'order_items',
                [
                    'order_id',
                    'order_item_id',
                    'product_id',
                    'seller_id',
                    'shipping_limit_date',
                    'price',
                    'freight_value'
                ],
                3000
            );
            // 7. Order Payments (~103k baris)
            $this->fastBatchImport(
                $basePath . '/olist_order_payments_dataset.csv',
                'order_payments',
                [
                    'order_id',
                    'payment_sequential',
                    'payment_type',
                    'payment_installments',
                    'payment_value'
                ],
                3000
            );
            // 8. Order Reviews (~99k baris)
            $this->fastBatchImport(
                $basePath . '/olist_order_reviews_dataset.csv',
                'order_reviews',
                [
                    'review_id',
                    'order_id',
                    'review_score',
                    'review_comment_title',
                    'review_comment_message',
                    'review_creation_date',
                    'review_answer_timestamp'
                ],
                2500
            );
            // 9. Geolocation (1.000.163 baris)
            $this->fastBatchImport(
                $basePath . '/olist_geolocation_dataset.csv',
                'geolocations',
                [
                    'geolocation_zip_code_prefix',
                    'geolocation_lat',
                    'geolocation_lng',
                    'geolocation_city',
                    'geolocation_state'
                ],
                5000 // Batch size 5.000 agar import 1 juta data selesai dalam ~15-20 detik
            );
        } finally {
            // Selalu aktifkan kembali Foreign Key Checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
        $duration = round(microtime(true) - $startTime, 2);
        $this->newLine();
        $this->info("🎉 SEMUA DATASET BERHASIL DIIMPOR dalam waktu {$duration} detik!");
        return 0;
    }
    /**
     * Membaca file CSV secara streaming dan menyimpan ke DB per chunk (batch).
     */
    private function fastBatchImport(string $filePath, string $table, array $columns, int $chunkSize = 2500)
    {
        if (!file_exists($filePath)) {
            $this->warn("File tidak ditemukan: {$filePath}, melewati...");
            return;
        }
        $this->line("<comment>-> Mengimpor:</comment> <info>{$table}</info> dari " . basename($filePath));
        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            $this->error("Gagal membuka file: {$filePath}");
            return;
        }
        // Lewati baris header CSV
        fgetcsv($handle);
        $batch = [];
        $totalRows = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $record = [];
            foreach ($columns as $index => $column) {
                $val = isset($row[$index]) ? trim($row[$index]) : null;
                // Bersihkan nilai null / kosong
                $record[$column] = ($val === '' || strtolower($val) === 'null' || strtolower($val) === 'nan') ? null : $val;
            }
            $batch[] = $record;
            if (count($batch) >= $chunkSize) {
                DB::table($table)->insertOrIgnore($batch);
                $totalRows += count($batch);
                $batch = [];
                // Cetak titik sebagai feedback progress agar terminal responsif
                $this->output->write('.');
            }
        }
        // Masukkan sisa data yang tersisa di buffer
        if (!empty($batch)) {
            DB::table($table)->insertOrIgnore($batch);
            $totalRows += count($batch);
        }
        fclose($handle);
        $this->line(" [OK: " . number_format($totalRows) . " baris]");
    }
    /**
     * Khusus kategori: import kamus terjemahan dan tambahkan 2 kategori yang belum ada di translation
     */
    private function importCategories(string $filePath)
    {
        $this->fastBatchImport(
            $filePath,
            'product_category_translations',
            ['product_category_name', 'product_category_name_english'],
            500
        );
        // Tambahkan 2 kategori yang ada di produk tapi tidak ada di file translasi
        DB::table('product_category_translations')->insertOrIgnore([
            [
                'product_category_name' => 'pc_gamer',
                'product_category_name_english' => 'pc_gamer'
            ],
            [
                'product_category_name' => 'portateis_cozinha_e_preparadores_de_alimentos',
                'product_category_name_english' => 'small_appliances_food_preparers'
            ],
        ]);
        $this->line("<info>✓ Kategori tambahan (pc_gamer, portateis_cozinha) berhasil disinkronkan.</info>");
    }
}
