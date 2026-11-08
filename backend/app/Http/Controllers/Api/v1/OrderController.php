<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
  protected OrderService $orderService;

  public function __construct(OrderService $orderService)
  {
    $this->orderService = $orderService;
  }

  public function pendingShipment(Request $request)
  {
    $orders = $this->orderService->getPendingShipmentOrders($request);

    return response()->json([
      'success' => true,
      'data' => $orders->items(),
      'pagination' => [
        'current_page' => $orders->currentPage(),
        'last_page' => $orders->lastPage(),
        'per_page' => $orders->perPage(),
        'total' => $orders->total(),
      ],
    ]);
  }
}
