import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("semua");

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/orders/user/${user.id}`);
      setOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      waiting_payment: "bg-orange-100 text-orange-800 border-orange-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      success: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return statuses[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      waiting_payment: "⏳",
      pending: "🔄",
      success: "✅",
      failed: "❌",
      processing: "📦",
    };
    return icons[status] || "📋";
  };

  const getStatusText = (status) => {
    const texts = {
      waiting_payment: "Menunggu Pembayaran",
      pending: "Menunggu Konfirmasi Admin",
      success: "Pembayaran Sukses",
      failed: "Pembayaran Ditolak",
      processing: "Pesanan Diproses",
    };
    return texts[status] || status;
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePayment = (orderId) => {
    navigate(`/payment/${orderId}`);
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === "semua") return true;
    return order.status_pembayaran === selectedFilter;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status_pembayaran === "pending").length,
    success: orders.filter((o) => o.status_pembayaran === "success").length,
    // Hapus stats waiting
  };

  // Auto refresh setiap 5 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchOrders();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Riwayat Pembelian
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Kelola dan lacak pesanan Anda
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Hanya 3 card (hapus Menunggu Bayar) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Pesanan</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Menunggu Verifikasi</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🔄</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Selesai</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.success}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs - Hapus tab Menunggu Bayar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "semua", label: "Semua", icon: "📋" },
            { value: "pending", label: "Verifikasi", icon: "🔄" },
            { value: "success", label: "Selesai", icon: "✅" },
            { value: "failed", label: "Ditolak", icon: "❌" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedFilter === filter.value
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
              }`}
            >
              {filter.icon} {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-400 mt-3">Memuat riwayat pesanan...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="text-7xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Belum Ada Pesanan
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedFilter === "semua"
                ? "Anda belum memiliki riwayat pembelian"
                : `Tidak ada pesanan dengan status ${selectedFilter}`}
            </p>
            <button
              onClick={() => navigate("/medicines")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
            >
              🛒 Belanja Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Order ID</p>
                        <p className="font-mono text-sm font-semibold text-gray-800">
                          #{order.id.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Tanggal Transaksi
                        </p>
                        <p className="text-sm text-gray-700">
                          {formatDate(order.tanggal_transaksi)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${getStatusBadge(order.status_pembayaran)} flex items-center gap-1`}
                      >
                        {getStatusIcon(order.status_pembayaran)}{" "}
                        {getStatusText(order.status_pembayaran)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="space-y-3">
                    {order.order_details?.map((detail) => (
                      <div
                        key={detail.id}
                        className="flex justify-between items-center hover:bg-green-50 p-2 rounded-lg transition"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {detail.medicines?.nama_obat}
                          </p>
                          <p className="text-sm text-gray-500">
                            {detail.jumlah} x Rp{" "}
                            {formatRupiah(detail.medicines?.harga)}
                          </p>
                        </div>
                        <p className="font-bold text-green-600">
                          Rp {formatRupiah(detail.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Total Belanja</p>
                        <p className="font-bold text-2xl text-green-600">
                          Rp {formatRupiah(order.total_harga)}
                        </p>
                      </div>

                      {/* Action Buttons - Hanya untuk pending, success, failed (hapus waiting_payment) */}
                      {order.status_pembayaran === "pending" && (
                        <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl">
                          <svg
                            className="w-5 h-5 animate-spin text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-yellow-700 text-sm font-medium">
                            Menunggu verifikasi admin...
                          </span>
                        </div>
                      )}

                      {order.status_pembayaran === "success" && (
                        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-green-700 text-sm font-medium">
                            Pembayaran telah diverifikasi
                          </span>
                        </div>
                      )}

                      {order.status_pembayaran === "failed" && (
                        <button
                          onClick={() => handlePayment(order.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <span>📤</span> Upload Ulang Bukti
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
