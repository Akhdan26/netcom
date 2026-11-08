<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DatasetService
{
  // Whitelist tabel yang diizinkan untuk CRUD
  protected array $allowedTables = [
    'customers' => 'customer_id',
    'sellers' => 'seller_id',
    'products' => 'product_id',
    'orders' => 'order_id',
    'order_items' => 'order_id',
    'order_payments' => 'order_id',
    'order_reviews' => 'id',
    'geolocations' => 'id',
    'product_category_translations' => 'product_category_name',
  ];

  public function getList(string $table, Request $request)
  {
    $this->validateTable($table);
    $perPage = (int) $request->input('per_page', 15);
    $primaryKey = $this->allowedTables[$table];

    $query = DB::table($table);

    if ($request->filled('search')) {
      $search = $request->input('search');
      $columns = Schema::getColumnListing($table);
      $query->where(function ($q) use ($columns, $search) {
        foreach ($columns as $col) {
          $q->orWhere($col, 'like', "%{$search}%");
        }
      });
    }

    return $query->orderBy($primaryKey, 'desc')->paginate($perPage);
  }

  public function find(string $table, int|string $id)
  {
    $this->validateTable($table);
    $pk = $this->allowedTables[$table];
    $record = DB::table($table)->where($pk, $id)->first();

    if (!$record) {
      throw new NotFoundHttpException("Data tidak ditemukan.");
    }

    return $record;
  }

  public function create(string $table, array $data)
  {
    $this->validateTable($table);
    DB::table($table)->insert($data);
    return $data;
  }

  public function update(string $table, int|string $id, array $data)
  {
    $this->validateTable($table);
    $pk = $this->allowedTables[$table];
    DB::table($table)->where($pk, $id)->update($data);
    return $this->find($table, $id);
  }

  public function delete(string $table, int|string $id)
  {
    $this->validateTable($table);
    $pk = $this->allowedTables[$table];
    return DB::table($table)->where($pk, $id)->delete();
  }

  private function validateTable(string $table)
  {
    if (!array_key_exists($table, $this->allowedTables)) {
      throw new NotFoundHttpException("Dataset '{$table}' tidak valid.");
    }
  }
}
