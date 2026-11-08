<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\Analytics\RevenueAnalyticsService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
  protected RevenueAnalyticsService $revenueService;

  public function __construct(RevenueAnalyticsService $revenueService)
  {
    $this->revenueService = $revenueService;
  }

  public function dailyRevenue(Request $request)
  {
    $request->validate([
      'year' => 'required|integer|min:2016|max:2018',
      'month' => 'nullable|integer|min:1|max:12',
    ]);

    $year = (int) $request->input('year', 2017);
    $month = $request->filled('month') ? (int) $request->input('month') : null;

    $results = $this->revenueService->getDailyRevenue($year, $month);

    $anomaliesCount = count(array_filter($results, fn($r) => $r['is_anomaly']));
    $totalRevenue = array_sum(array_column($results, 'revenue'));

    return response()->json([
      'success' => true,
      'meta' => [
        'year' => $year,
        'month' => $month,
        'total_revenue' => round($totalRevenue, 2),
        'anomalies_detected' => $anomaliesCount,
      ],
      'data' => $results,
    ]);
  }

  public function anomalies(Request $request)
  {
    $request->validate([
      'year' => 'required|integer|min:2016|max:2018',
      'month' => 'nullable|integer|min:1|max:12',
    ]);

    $year = (int) $request->input('year', 2017);
    $month = $request->filled('month') ? (int) $request->input('month') : null;

    $results = $this->revenueService->getDailyRevenue($year, $month);
    $onlyAnomalies = array_values(array_filter($results, fn($r) => $r['is_anomaly']));

    return response()->json([
      'success' => true,
      'count' => count($onlyAnomalies),
      'data' => $onlyAnomalies,
    ]);
  }
}
