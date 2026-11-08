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
        Schema::create('order_reviews', function (Blueprint $table) {
            $table->id(); // Auto-increment PK mengatasi review_id duplikat
            $table->char('review_id', 32)->index();
            $table->char('order_id', 32);
            $table->tinyInteger('review_score');
            $table->string('review_comment_title', 255)->nullable();
            $table->text('review_comment_message')->nullable();
            $table->dateTime('review_creation_date');
            $table->dateTime('review_answer_timestamp');

            $table->foreign('order_id')->references('order_id')->on('orders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_reviews');
    }
};
