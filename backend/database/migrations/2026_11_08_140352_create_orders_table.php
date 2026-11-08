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
        Schema::create('orders', function (Blueprint $table) {
            $table->char('order_id', 32)->primary();
            $table->char('customer_id', 32);
            $table->string('order_status', 30);
            $table->dateTime('order_purchase_timestamp');
            $table->dateTime('order_approved_at')->nullable();
            $table->dateTime('order_delivered_carrier_date')->nullable();
            $table->dateTime('order_delivered_customer_date')->nullable();
            $table->dateTime('order_estimated_delivery_date');

            // Foreign Key
            $table->foreign('customer_id')->references('customer_id')->on('customers');

            // Tabel index untuk performa grafik revenue & pending orders
            $table->index(['order_purchase_timestamp', 'order_status'], 'idx_purchase_status');
            $table->index(['order_status', 'order_delivered_carrier_date'], 'idx_unshipped');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
