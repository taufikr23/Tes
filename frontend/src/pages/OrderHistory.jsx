import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      waiting_payment: "bg-orange-100 text-orange-800",
      pending: "bg-yellow-100 text-yellow-800",
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      processing: "bg-blue-100 text-blue-800",
    };
    return statuses[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      waiting_payment: "⏳ Menunggu Pembayaran",
      pending: "⏳ Menunggu Konfirmasi Admin",
      success: "✅ Pembayaran Sukses",
      failed: "❌ Pembayaran Ditolak",
      processing: "📦 Pesanan Diproses",
    };
    return texts[status] || status;
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  const handlePayment = (orderId) => {
    navigate(`/payment/${orderId}`);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Riwayat Pembelian
      </h1>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Belum ada riwayat pembelian</p>
          <button
            onClick={() => navigate("/medicines")}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
          >
            Belanja Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: {order.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      Tanggal:{" "}
                      {new Date(order.tanggal_transaksi).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status_pembayaran)}`}
                    >
                      {getStatusText(order.status_pembayaran)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {order.order_details?.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {detail.medicines?.nama_obat}
                        </p>
                        <p className="text-sm text-gray-500">
                          {detail.jumlah} x Rp{" "}
                          {formatRupiah(detail.medicines?.harga)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        Rp {formatRupiah(detail.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-lg">Total</p>
                    <p className="font-bold text-xl text-emerald-600">
                      Rp {formatRupiah(order.total_harga)}
                    </p>
                  </div>
                </div>

                {/* Tombol Bayar untuk status waiting_payment */}
                {order.status_pembayaran === "waiting_payment" && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handlePayment(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                )}

                {/* Status menunggu verifikasi admin */}
                {order.status_pembayaran === "pending" && (
                  <div className="mt-4 flex justify-end">
                    <span className="text-yellow-600 text-sm flex items-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
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
                      Menunggu verifikasi admin...
                    </span>
                  </div>
                )}

                {/* Status sukses */}
                {order.status_pembayaran === "success" && (
                  <div className="mt-4 flex justify-end">
                    <span className="text-green-600 text-sm flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
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
                      Pembayaran telah diverifikasi
                    </span>
                  </div>
                )}

                {/* Status ditolak - bisa upload ulang */}
                {order.status_pembayaran === "failed" && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handlePayment(order.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    >
                      Upload Ulang Bukti Pembayaran
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
