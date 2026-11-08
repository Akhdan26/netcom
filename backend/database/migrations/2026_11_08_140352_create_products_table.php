<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->char('product_id', 32)->primary();
            $table->string('product_category_name', 100)->nullable()->index();

            // Mengikuti nama atribut dari CSV (ejaan 'lenght')
            $table->unsignedInteger('product_name_lenght')->nullable();
            $table->unsignedInteger('product_description_lenght')->nullable();
            $table->unsignedSmallInteger('product_photos_qty')->nullable();
            $table->unsignedInteger('product_weight_g')->nullable();
            $table->unsignedSmallInteger('product_length_cm')->nullable();
            $table->unsignedSmallInteger('product_height_cm')->nullable();
            $table->unsignedSmallInteger('product_width_cm')->nullable();

            // Foreign Key ke tabel translasi kategori
            $table->foreign('product_category_name')
                ->references('product_category_name')
                ->on('product_category_translations')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
