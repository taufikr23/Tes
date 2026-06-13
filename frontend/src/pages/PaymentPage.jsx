import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

const PaymentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentProof, setPaymentProof] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchOrder();
    checkExistingPayment();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.data);
    } catch (err) {
      console.error("Error fetching order:", err);
      alert("Gagal memuat data pesanan");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingPayment = async () => {
    try {
      const res = await api.get(`/payments/order/${orderId}`);
      if (res.data.data) {
        setPayment(res.data.data);
        if (res.data.data.payment_status === "rejected") {
          // Isi ulang notes dari payment sebelumnya
          if (res.data.data.notes) {
            setNotes(res.data.data.notes);
          }
          alert(
            "❌ Pembayaran Anda sebelumnya ditolak. Silakan upload ulang bukti pembayaran yang valid.",
          );
        }
      }
    } catch (err) {
      console.error("Error checking payment:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentProof) {
      alert("Silakan upload bukti pembayaran");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/payments", {
        order_id: orderId,
        user_id: user.id,
        amount: order?.total_harga,
        payment_method: paymentMethod,
        payment_proof: paymentProof,
        notes: notes,
      });

      if (response.data.success) {
        alert(
          "✅ Bukti pembayaran berhasil dikirim! Admin akan melakukan verifikasi.",
        );
        navigate("/orders");
      } else {
        alert(response.data.message || "Gagal mengirim pembayaran");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert(err.response?.data?.message || "Gagal mengirim pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  const getBankInstructions = () => {
    return (
      <div className="bg-blue-50 p-4 rounded-xl mb-4">
        <h4 className="font-semibold text-blue-800 mb-2">
          📋 Instruksi Transfer Bank
        </h4>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Bank:</span> BCA
          </p>
          <p>
            <span className="font-medium">Nomor Rekening:</span> 123-456-7890
          </p>
          <p>
            <span className="font-medium">Atas Nama:</span> PT T-Medic Sehat
          </p>
          <p>
            <span className="font-medium">Jumlah Transfer:</span>{" "}
            <span className="font-bold text-green-600">
              Rp {formatRupiah(order?.total_harga)}
            </span>
          </p>
        </div>
      </div>
    );
  };

  const getQrisInstructions = () => {
    return (
      <div className="bg-green-50 p-4 rounded-xl text-center mb-4">
        <h4 className="font-semibold text-green-800 mb-2">📱 Scan QRIS</h4>
        <div className="w-32 h-32 bg-white rounded-xl mx-auto flex items-center justify-center mb-2">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-3xl">📱</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan QR Code</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Total: Rp {formatRupiah(order?.total_harga)}
        </p>
      </div>
    );
  };

  const getVaInstructions = () => {
    return (
      <div className="bg-purple-50 p-4 rounded-xl mb-4">
        <h4 className="font-semibold text-purple-800 mb-2">
          🏧 Virtual Account
        </h4>
        <p className="text-sm">
          VA Number:{" "}
          <span className="font-mono font-bold">
            88608{order?.id?.slice(0, 6)}
          </span>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Total: Rp {formatRupiah(order?.total_harga)}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      </div>
    );
  }

  // Jika pembayaran sudah diverifikasi
  if (payment && payment.payment_status === "verified") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 text-center">
            <div className="text-6xl mb-4 text-green-500">✅</div>
            <h2 className="text-2xl font-bold mb-2">Pembayaran Diverifikasi</h2>
            <p className="text-gray-600 mb-4">
              Pembayaran Anda telah diverifikasi. Pesanan akan segera diproses.
            </p>
            <button
              onClick={() => navigate("/orders")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
            >
              Lihat Pesanan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Jika pembayaran pending (menunggu verifikasi)
  if (payment && payment.payment_status === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 text-center">
            <div className="text-6xl mb-4 text-yellow-500">⏳</div>
            <h2 className="text-2xl font-bold mb-2">Pembayaran Diproses</h2>
            <p className="text-gray-600 mb-4">
              Pembayaran Anda sedang menunggu verifikasi admin.
            </p>
            <button
              onClick={() => navigate("/orders")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
            >
              Lihat Pesanan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FORM PEMBAYARAN (untuk pertama kali atau upload ulang)
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
            <h1 className="text-xl font-bold text-white">
              {payment && payment.payment_status === "rejected"
                ? "📤 Upload Ulang Bukti Pembayaran"
                : "💳 Konfirmasi Pembayaran"}
            </h1>
            <p className="text-emerald-100 text-sm">
              {payment && payment.payment_status === "rejected"
                ? "Pembayaran ditolak, silakan upload ulang bukti yang valid"
                : "Silakan lakukan pembayaran dan upload bukti transfer"}
            </p>
          </div>

          <div className="p-6">
            {/* Ringkasan Pesanan - SELALU TAMPIL */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                📋 Ringkasan Pesanan
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono text-xs">
                    {order?.id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Pembayaran:</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    Rp {formatRupiah(order?.total_harga)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pesan penolakan jika ada */}
            {payment &&
              payment.payment_status === "rejected" &&
              payment.notes && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-600 text-sm font-medium mb-1">
                    ❌ Alasan Penolakan:
                  </p>
                  <p className="text-red-600 text-sm">{payment.notes}</p>
                </div>
              )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Metode Pembayaran */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="bank_transfer">
                    🏦 Transfer Bank (BCA/Mandiri/BNI)
                  </option>
                  <option value="qris">
                    📱 QRIS (Scan via Gopay/OVO/ShopeePay)
                  </option>
                  <option value="virtual_account">🏧 Virtual Account</option>
                </select>
              </div>

              {/* Instruksi berdasarkan metode (SELALU TAMPIL) */}
              {paymentMethod === "bank_transfer" && getBankInstructions()}
              {paymentMethod === "qris" && getQrisInstructions()}
              {paymentMethod === "virtual_account" && getVaInstructions()}

              {/* Upload Bukti */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  📎 Bukti Pembayaran (URL Foto)
                </label>
                <input
                  type="text"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  placeholder="https://example.com/bukti-pembayaran.jpg"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Upload foto bukti transfer yang jelas dan valid
                </p>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  📝 Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Nama pengirim, bank asal, dll"
                  rows="2"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tombol Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Memproses...
                  </span>
                ) : payment && payment.payment_status === "rejected" ? (
                  "📤 Upload Ulang Bukti Pembayaran"
                ) : (
                  "✅ Konfirmasi Pembayaran"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
