<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderService
{
  public function getPendingShipmentOrders(Request $request)
  {
    $perPage = (int) $request->input('per_page', 15);
    $status = $request->input('status');
    $search = $request->input('search');

    $query = DB::table('orders as o')
      ->join('customers as c', 'o.customer_id', '=', 'c.customer_id')
      ->leftJoin('order_payments as p', 'o.order_id', '=', 'p.order_id')
      ->whereNull('o.order_delivered_carrier_date')
      ->whereNotIn('o.order_status', ['delivered', 'canceled', 'unavailable'])
      ->select([
        'o.order_id',
        'o.order_status',
        'o.order_purchase_timestamp',
        'o.order_estimated_delivery_date',
        'c.customer_city',
        'c.customer_state',
        DB::raw('COALESCE(SUM(p.payment_value), 0) as total_value'),
      ])
      ->groupBy([
        'o.order_id',
        'o.order_status',
        'o.order_purchase_timestamp',
        'o.order_estimated_delivery_date',
        'c.customer_city',
        'c.customer_state',
      ])
      ->orderBy('o.order_purchase_timestamp', 'desc');

    if ($status) {
      $query->where('o.order_status', $status);
    }

    if ($search) {
      $query->where(function ($q) use ($search) {
        $q->where('o.order_id', 'like', "%{$search}%")
          ->orWhere('c.customer_city', 'like', "%{$search}%");
      });
    }

    return $query->paginate($perPage);
  }
}
