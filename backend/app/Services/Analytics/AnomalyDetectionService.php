<?php

namespace App\Services\Analytics;

class AnomalyDetectionService
{
  /**
   * Mendeteksi anomali revenue harian menggunakan metode IQR (Interquartile Range)
   * dan Z-Score sebagai indikator kekuatan deviasi.
   */
  public function detect(array $dailyData): array
  {
    $count = count($dailyData);
    if ($count < 4) {
      // Data terlalu sedikit untuk analisis statistik IQR
      return array_map(function ($item) {
        $item['is_anomaly'] = false;
        $item['anomaly_type'] = 'NORMAL';
        $item['z_score'] = 0;
        return $item;
      }, $dailyData);
    }

    // Ambil semua nilai revenue dan urutkan
    $revenues = array_column($dailyData, 'revenue');
    sort($revenues);

    // 1. Hitung Q1, Q3, dan IQR
    $q1 = $this->getPercentile($revenues, 0.25);
    $q3 = $this->getPercentile($revenues, 0.75);
    $iqr = $q3 - $q1;

    $lowerBound = max(0, $q1 - (1.5 * $iqr));
    $upperBound = $q3 + (1.5 * $iqr);

    // 2. Hitung Rata-rata dan Standar Deviasi untuk Z-Score
    $mean = array_sum($revenues) / $count;
    $variance = array_sum(array_map(fn($x) => pow($x - $mean, 2), $revenues)) / $count;
    $stdDev = sqrt($variance) ?: 1;

    // 3. Klasifikasikan setiap record harian
    return array_map(function ($row) use ($lowerBound, $upperBound, $mean, $stdDev) {
      $revenue = (float) $row['revenue'];
      $isHigh = $revenue > $upperBound;
      $isLow = $revenue < $lowerBound && $revenue > 0;
      $zScore = round(($revenue - $mean) / $stdDev, 2);

      $row['is_anomaly'] = $isHigh || $isLow;
      $row['anomaly_type'] = $isHigh ? 'SPIKE' : ($isLow ? 'DROP' : 'NORMAL');
      $row['z_score'] = $zScore;
      $row['thresholds'] = [
        'lower_bound' => round($lowerBound, 2),
        'upper_bound' => round($upperBound, 2),
        'average' => round($mean, 2),
      ];

      return $row;
    }, $dailyData);
  }

  private function getPercentile(array $sorted, float $p): float
  {
    $index = $p * (count($sorted) - 1);
    $floor = floor($index);
    $ceil = ceil($index);

    if ($floor == $ceil) {
      return $sorted[(int) $index];
    }

    return $sorted[(int) $floor] + ($index - $floor) * ($sorted[(int) $ceil] - $sorted[(int) $floor]);
  }
}
