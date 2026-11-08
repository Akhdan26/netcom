import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { Truck, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function PendingOrdersView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pendingOrders", page, search, status],
    queryFn: async () => {
      const res = await api.get("/orders/pending-shipment", {
        params: { page, search, status, per_page: 15 },
      });
      return res.data;
    },
  });

  const orders = data?.data || [];
  const pagination = data?.pagination || {};

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              Antrean Pesanan Belum Dikirim
            </h3>
            <p className="text-xs text-gray-400">
              Total {pagination.total || 0} pesanan menunggu proses logistik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Cari ID pesanan / kota..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-sm rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-56"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-gray-50 border border-gray-200 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Semua Status Pending</option>
            <option value="processing">Processing</option>
            <option value="invoiced">Invoiced</option>
            <option value="approved">Approved</option>
            <option value="created">Created</option>
          </select>
        </div>
      </div>

      {/* Tabel Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Tgl Pembelian</th>
                  <th className="py-3 px-4">Lokasi Pelanggan</th>
                  <th className="py-3 px-4">Total Nilai</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Estimasi Sampai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr
                    key={o.order_id}
                    className="hover:bg-gray-50/50 transition"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-xs text-blue-600">
                      {o.order_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {new Date(o.order_purchase_timestamp).toLocaleDateString(
                        "id-ID",
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 capitalize">
                      {o.customer_city},{" "}
                      <span className="font-semibold text-gray-500">
                        {o.customer_state}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {formatCurrency(o.total_value)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium capitalize">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 flex items-center gap-1.5 pt-4">
                      <Clock size={14} className="text-gray-400" />
                      {new Date(
                        o.order_estimated_delivery_date,
                      ).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Halaman {pagination.current_page || 1} dari{" "}
            {pagination.last_page || 1}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= (pagination.last_page || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
