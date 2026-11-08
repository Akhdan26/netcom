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
        Schema::create('order_payments', function (Blueprint $table) {
            $table->char('order_id', 32);
            $table->unsignedInteger('payment_sequential');
            $table->string('payment_type', 30);
            $table->unsignedSmallInteger('payment_installments');
            $table->decimal('payment_value', 10, 2);

            $table->primary(['order_id', 'payment_sequential']);
            $table->foreign('order_id')->references('order_id')->on('orders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_payments');
    }
};
