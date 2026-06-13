import React, { useState, useEffect } from "react";
import api from "../utils/api";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get("/payments");
      setPayments(res.data.data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (id, status) => {
    if (!confirm(`Konfirmasi pembayaran ini?`)) return;
    setProcessing(id);
    try {
      await api.put(`/payments/${id}/verify`, { payment_status: status });
      alert(
        `✅ Pembayaran ${status === "verified" ? "diverifikasi" : "ditolak"}`,
      );
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memverifikasi");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-700",
      verified: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
    };
    return badges[status] || "bg-gray-100";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Menunggu Verifikasi",
      verified: "Diverifikasi",
      rejected: "Ditolak",
      completed: "Selesai",
    };
    return texts[status] || status;
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = payments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(payments.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
        <h3 className="text-lg font-semibold text-emerald-800">
          💰 Manajemen Pembayaran
        </h3>
        <p className="text-sm text-gray-500">
          Total: {payments.length} pembayaran
        </p>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-400 mt-2">Memuat data...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-2">💰</div>
            <p className="text-gray-400">Belum ada pembayaran</p>
          </div>
        ) : (
          <>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bukti
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(payment.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {payment.profiles?.nama}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      {payment.order_id?.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                      Rp {formatRupiah(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.payment_method === "bank_transfer"
                        ? "🏦 Transfer Bank"
                        : payment.payment_method === "qris"
                          ? "📱 QRIS"
                          : payment.payment_method === "virtual_account"
                            ? "🏧 VA"
                            : payment.payment_method}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.payment_status)}`}
                      >
                        {getStatusText(payment.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payment.payment_proof && (
                        <a
                          href={payment.payment_proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 text-sm"
                        >
                          Lihat Bukti
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {payment.payment_status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              verifyPayment(payment.id, "verified")
                            }
                            disabled={processing === payment.id}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition disabled:opacity-50"
                          >
                            Verifikasi
                          </button>
                          <button
                            onClick={() =>
                              verifyPayment(payment.id, "rejected")
                            }
                            disabled={processing === payment.id}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                      {payment.payment_status === "verified" && (
                        <span className="text-emerald-600 text-sm">
                          ✅ Diverifikasi
                        </span>
                      )}
                      {payment.payment_status === "rejected" && (
                        <span className="text-rose-600 text-sm">
                          ❌ Ditolak
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  ← Sebelumnya
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="w-8 h-8 flex items-center justify-center text-gray-400">
                        ...
                      </span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                          currentPage === totalPages
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
