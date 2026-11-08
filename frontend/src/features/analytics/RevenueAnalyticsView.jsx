import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  Filter,
} from "lucide-react";

export default function RevenueAnalyticsView() {
  const [year, setYear] = useState("2017");
  const [month, setMonth] = useState("11"); // Default ke Nov 2017 (bulan dengan anomali terbesar)

  // Fetch data dari API Laravel
  const { data, isLoading, error } = useQuery({
    queryKey: ["dailyRevenue", year, month],
    queryFn: async () => {
      const params = { year };
      if (month) params.month = month;
      const res = await api.get("/analytics/revenue/daily", { params });
      return res.data;
    },
  });

  const chartData = data?.data || [];
  const meta = data?.meta || {};
  const anomalies = chartData.filter((item) => item.is_anomaly);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              Filter Periode Analitik
            </h3>
            <p className="text-xs text-gray-400">
              Pilih rentang tahun dan bulan transaksi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="2016">Tahun 2016</option>
              <option value="2017">Tahun 2017</option>
              <option value="2018">Tahun 2018</option>
            </select>
          </div>

          <div>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Semua Bulan (Tahunan)</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {new Date(2000, i, 1).toLocaleString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(meta.total_revenue || 0)}
            </h3>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp size={14} /> Periode Aktif
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total Pesanan
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {chartData
                .reduce((acc, curr) => acc + (curr.orders_count || 0), 0)
                .toLocaleString()}
            </h3>
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
              <ShoppingBag size={14} /> Transaksi Valid
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Anomali Terdeteksi
            </p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">
              {anomalies.length} Tanggal
            </h3>
            <span className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              Metode IQR (1.5x)
            </span>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">
              Grafik Total Revenue Harian
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Titik merah mengindikasikan hari dengan lonjakan/penurunan ekstrem
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
              <span className="text-gray-600">Revenue Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-gray-600">Anomali Terdeteksi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-500 border-dashed"></span>
              <span className="text-gray-600">
                Batas Wajar (Upper Threshold)
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.slice(-2)}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-slate-300">
                            {d.formatted_date}
                          </p>
                          <p className="text-sm font-bold text-blue-400">
                            {formatCurrency(d.revenue)}
                          </p>
                          <p className="text-slate-400">
                            {d.orders_count} pesanan
                          </p>
                          {d.is_anomaly && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-md font-semibold">
                              ⚠️ Anomali: {d.anomaly_type} (Z-Score: {d.z_score}
                              )
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  shape={(props) => {
                    const { fill, x, y, width, height, payload } = props;
                    const isAnomaly = payload.is_anomaly;
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={isAnomaly ? "#ef4444" : fill}
                        rx={4}
                      />
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="thresholds.upper_bound"
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabel Rincian Anomali */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          Daftar Tanggal Anomali Terdeteksi
        </h3>

        {anomalies.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Tidak ditemukan anomali signifikan pada rentang waktu yang dipilih.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Total Revenue</th>
                  <th className="py-3 px-4">Batas Atas Wajar</th>
                  <th className="py-3 px-4">Z-Score</th>
                  <th className="py-3 px-4">Status & Analisis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anomalies.map((item) => (
                  <tr key={item.date} className="hover:bg-red-50/30 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.formatted_date}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {formatCurrency(item.thresholds?.upper_bound || 0)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-red-600">
                      +{item.z_score}σ
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        Lonjakan Ekstrem ({item.anomaly_type})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
