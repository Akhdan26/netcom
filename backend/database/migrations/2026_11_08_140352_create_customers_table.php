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
        Schema::create('customers', function (Blueprint $table) {
            $table->char('customer_id', 32)->primary();
            $table->char('customer_unique_id', 32)->index();
            $table->unsignedInteger('customer_zip_code_prefix')->index();
            $table->string('customer_city', 100);
            $table->char('customer_state', 2);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
