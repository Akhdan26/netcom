<?php

namespace App\Services\Analytics;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class RevenueAnalyticsService
{
  protected AnomalyDetectionService $anomalyService;

  public function __construct(AnomalyDetectionService $anomalyService)
  {
    $this->anomalyService = $anomalyService;
  }

  /**
   * Mendapatkan revenue harian berdasarkan tahun dan bulan (opsional).
   */
  public function getDailyRevenue(int $year, ?int $month = null): array
  {
    if ($month) {
      $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
      $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();
    } else {
      $startDate = Carbon::createFromDate($year, 1, 1)->startOfYear();
      $endDate = Carbon::createFromDate($year, 12, 31)->endOfYear();
    }

    // Query Agregasi Database
    $rawSales = DB::table('orders as o')
      ->join('order_payments as p', 'o.order_id', '=', 'p.order_id')
      ->whereNotIn('o.order_status', ['canceled', 'unavailable'])
      ->whereBetween('o.order_purchase_timestamp', [
        $startDate->toDateTimeString(),
        $endDate->toDateTimeString()
      ])
      ->selectRaw('DATE(o.order_purchase_timestamp) as date, SUM(p.payment_value) as revenue, COUNT(DISTINCT o.order_id) as total_orders')
      ->groupBy(DB::raw('DATE(o.order_purchase_timestamp)'))
      ->get()
      ->keyBy('date');

    // Date-Zero-Filling: Isi tanggal kosong agar grafik Recharts tidak terputus
    $period = CarbonPeriod::create($startDate, $endDate);
    $dailyData = [];

    foreach ($period as $date) {
      $dateStr = $date->format('Y-m-d');
      $dailyData[] = [
        'date' => $dateStr,
        'formatted_date' => $date->format('d M Y'),
        'revenue' => isset($rawSales[$dateStr]) ? round((float) $rawSales[$dateStr]->revenue, 2) : 0,
        'orders_count' => isset($rawSales[$dateStr]) ? (int) $rawSales[$dateStr]->total_orders : 0,
      ];
    }

    // Jalankan Deteksi Anomali
    return $this->anomalyService->detect($dailyData);
  }
}
