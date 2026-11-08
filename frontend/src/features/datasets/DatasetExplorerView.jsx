import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import {
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const TABLES = [
  { key: "customers", label: "Customers (~99k)" },
  { key: "products", label: "Products (~32k)" },
  { key: "orders", label: "Orders (~99k)" },
  { key: "sellers", label: "Sellers (~3k)" },
  { key: "order_items", label: "Order Items (~112k)" },
  { key: "order_payments", label: "Order Payments (~103k)" },
  { key: "order_reviews", label: "Order Reviews (~99k)" },
  { key: "product_category_translations", label: "Categories" },
  { key: "geolocations", label: "Geolocations (1M)" },
];

const PK_MAP = {
  customers: "customer_id",
  sellers: "seller_id",
  products: "product_id",
  orders: "order_id",
  order_items: "order_id",
  order_payments: "order_id",
  order_reviews: "id",
  geolocations: "id",
  product_category_translations: "product_category_name",
};

export default function DatasetExplorerView() {
  const [selectedTable, setSelectedTable] = useState("customers");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedRow, setSelectedRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();

  const pkField = PK_MAP[selectedTable] || "id";

  // Fetch list
  const { data, isLoading } = useQuery({
    queryKey: ["datasetTable", selectedTable, page, search],
    queryFn: async () => {
      const res = await api.get(`/datasets/${selectedTable}`, {
        params: { page, search, per_page: 10 },
      });
      return res.data;
    },
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || {};
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/datasets/${selectedTable}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["datasetTable", selectedTable]);
      alert("Data berhasil dihapus!");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Gagal menghapus data.");
    },
  });

  // Save (Create or Update) Mutation
  const saveMutation = useMutation({
    mutationFn: async ({ mode, id, payload }) => {
      if (mode === "create") {
        return await api.post(`/datasets/${selectedTable}`, payload);
      } else {
        return await api.put(`/datasets/${selectedTable}/${id}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["datasetTable", selectedTable]);
      setModalOpen(false);
      setFormData({});
      setSelectedRow(null);
      alert(
        modalMode === "create"
          ? "Data baru berhasil ditambahkan!"
          : "Data berhasil diperbarui!"
      );
    },
    onError: (err) => {
      setFormError(
        err.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan data. Periksa format input Anda."
      );
    },
  });

  // Handler buka modal Add
  const handleOpenCreate = () => {
    setModalMode("create");
    setFormError("");
    const initial = {};
    columns.forEach((col) => {
      // id auto-increment tidak perlu diisi manual jika create
      if (col !== "id") {
        initial[col] = "";
      }
    });
    setFormData(initial);
    setModalOpen(true);
  };

  // Handler buka modal Edit
  const handleOpenEdit = (row) => {
    setModalMode("edit");
    setFormError("");
    setSelectedRow(row);
    const initial = {};
    columns.forEach((col) => {
      initial[col] = row[col] ?? "";
    });
    setFormData(initial);
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    // Bersihkan payload
    const payload = {};
    Object.keys(formData).forEach((k) => {
      const val = formData[k];
      payload[k] = val === "" ? null : val;
    });

    const pkValue = selectedRow ? selectedRow[pkField] : null;
    saveMutation.mutate({
      mode: modalMode,
      id: pkValue,
      payload,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Selector & Actions */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <Database size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              Dataset Explorer & CRUD Manager
            </h3>
            <p className="text-xs text-gray-400">
              Kelola, cari, tambah, ubah, dan hapus data dari 9 tabel Olist
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setPage(1);
              setSearch("");
            }}
            className="bg-gray-50 border border-gray-200 text-sm rounded-xl px-3.5 py-2 font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {TABLES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder={`Cari di ${selectedTable}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-sm rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none w-48 sm:w-56"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={16} />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : rows.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            Tidak ada data yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-100">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="py-3 px-4 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center sticky right-0 bg-gray-50 shadow-sm">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, idx) => {
                  const pkValue = row[pkField] ?? row[columns[0]];
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition font-mono"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="py-3 px-4 text-gray-700 max-w-xs truncate"
                        >
                          {String(row[col] ?? "-")}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center whitespace-nowrap sticky right-0 bg-white">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition"
                            title="Edit baris data"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Yakin ingin menghapus data dengan ID: ${pkValue}?`
                                )
                              ) {
                                deleteMutation.mutate(pkValue);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                            title="Hapus baris data"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Total {Number(pagination.total || 0).toLocaleString()} baris | Hal{" "}
            {pagination.current_page || 1} dari {pagination.last_page || 1}
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

      {/* Modal Add / Edit Data */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 text-base">
                  {modalMode === "create" ? "Tambah Data Baru" : "Ubah Data"} (
                  {selectedTable})
                </h4>
                <p className="text-xs text-gray-400">
                  {modalMode === "create"
                    ? "Isi atribut untuk record baru"
                    : `Memperbarui record ID: ${selectedRow?.[pkField]}`}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {Object.keys(formData).map((field) => {
                const isPk = field === pkField;
                const isAutoId = field === "id";
                // Pada mode edit, Primary Key dikunci (disabled) agar integritas relasi terjaga
                const isDisabled = (modalMode === "edit" && isPk) || (modalMode === "create" && isAutoId);

                return (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      {field} {isPk && <span className="text-indigo-600">(Primary Key)</span>}
                    </label>
                    <input
                      type="text"
                      disabled={isDisabled}
                      value={formData[field] ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [field]: e.target.value })
                      }
                      placeholder={isAutoId ? "(Auto Generated)" : `Masukkan ${field}...`}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                );
              })}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {saveMutation.isPending
                    ? "Menyimpan..."
                    : modalMode === "create"
                    ? "Simpan Data Baru"
                    : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
