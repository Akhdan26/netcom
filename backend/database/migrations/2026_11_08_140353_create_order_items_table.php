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
        Schema::create('order_items', function (Blueprint $table) {
            $table->char('order_id', 32);
            $table->unsignedInteger('order_item_id');
            $table->char('product_id', 32);
            $table->char('seller_id', 32);
            $table->dateTime('shipping_limit_date');
            $table->decimal('price', 10, 2);
            $table->decimal('freight_value', 10, 2);

            $table->primary(['order_id', 'order_item_id']);
            $table->foreign('order_id')->references('order_id')->on('orders');
            $table->foreign('product_id')->references('product_id')->on('products');
            $table->foreign('seller_id')->references('seller_id')->on('sellers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
