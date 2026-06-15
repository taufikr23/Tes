import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

// Komponen Toast Notification
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast.isLoading) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.isLoading, onClose]);

  const getIcon = () => {
    if (toast.isLoading) {
      return (
        <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    switch (toast.type) {
      case "success":
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    if (toast.isLoading) return "bg-blue-50 border-blue-500";
    switch (toast.type) {
      case "success": return "bg-green-50 border-green-500";
      case "error": return "bg-red-50 border-red-500";
      case "warning": return "bg-yellow-50 border-yellow-500";
      default: return "bg-blue-50 border-blue-500";
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-l-4 ${getBgColor()} 
        transition-all duration-300 transform w-80
        ${isExiting ? "animate-slide-out" : "animate-slide-in"}`}
    >
      <div className="p-3 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">
            {toast.message}
          </p>
        </div>
        {!toast.isLoading && (
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {toast.isLoading && (
        <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-loading-progress"></div>
        </div>
      )}
    </div>
  );
};

const CartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const isCheckingOut = useRef(false);

  // Toast functions
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, isLoading: false }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const showLoadingToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, isLoading: true }]);
    return id;
  };

  const updateLoadingToast = (id, message, type = "success") => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, message, type, isLoading: false } : toast
    ));
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const updateQuantity = (medicineId, change) => {
    const newCart = cart.map((item) => {
      if (item.medicine_id === medicineId) {
        const newJumlah = Math.max(1, item.jumlah + change);
        return {
          ...item,
          jumlah: newJumlah,
          subtotal: item.harga * newJumlah,
        };
      }
      return item;
    });
    saveCart(newCart);
    showToast(`Jumlah berhasil diubah`, "success");
  };

  const removeItem = (medicineId) => {
    const itemName = cart.find(item => item.medicine_id === medicineId)?.nama_obat;
    const newCart = cart.filter((item) => item.medicine_id !== medicineId);
    saveCart(newCart);
    showToast(`${itemName} dihapus dari keranjang`, "success");
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (processing || isCheckingOut.current) {
      return;
    }

    if (!user) {
      showToast("Silakan login terlebih dahulu", "error");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (cart.length === 0) {
      showToast("Keranjang belanja kosong", "error");
      return;
    }

    setProcessing(true);
    isCheckingOut.current = true;
    
    const toastId = showLoadingToast("🔄 Memproses checkout...");

    try {
      const validItems = cart.map((item) => ({
        medicine_id: item.medicine_id,
        jumlah: parseInt(item.jumlah, 10),
        subtotal: parseInt(item.subtotal, 10),
      }));

      const orderData = {
        user_id: user.id,
        items: validItems,
        total_harga: parseInt(totalPrice, 10),
      };

      const response = await api.post("/orders", orderData);

      if (response.data.success) {
        localStorage.removeItem("cart");
        setCart([]);
        updateLoadingToast(toastId, "✅ Pesanan berhasil dibuat! Silakan lakukan pembayaran.", "success");
        
        setTimeout(() => {
          navigate(`/payment/${response.data.data.id}`);
        }, 1500);
      } else {
        updateLoadingToast(toastId, response.data.message || "❌ Gagal membuat pesanan", "error");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      let errorMessage = "❌ Gagal checkout. ";
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Silakan coba lagi.";
      }
      updateLoadingToast(toastId, errorMessage, "error");
    } finally {
      setProcessing(false);
      isCheckingOut.current = false;
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <svg
              className="w-24 h-24 text-gray-400 mx-auto mb-4"
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
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Keranjang Belanja Kosong
            </h2>
            <p className="text-gray-500 mb-6">
              Silakan tambahkan obat dari halaman daftar obat
            </p>
            <button
              onClick={() => navigate("/medicines")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition font-semibold shadow-md hover:shadow-lg"
            >
              Lihat Daftar Obat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Keranjang Belanja</h1>
              <p className="text-gray-500 text-sm">Anda memiliki {cart.length} item di keranjang</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/medicines")}
            className="text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
          >
            + Tambah Obat
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div
                    key={item.medicine_id}
                    className="p-4 flex items-center gap-4 hover:bg-green-50 transition"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {item.nama_obat}
                      </h3>
                      <p className="text-green-600 text-sm font-medium">
                        Rp {formatRupiah(item.harga)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.medicine_id, -1)}
                        className="w-8 h-8 bg-gray-100 rounded-full hover:bg-green-500 hover:text-white transition flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.jumlah}</span>
                      <button
                        onClick={() => updateQuantity(item.medicine_id, 1)}
                        className="w-8 h-8 bg-gray-100 rounded-full hover:bg-green-500 hover:text-white transition flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-24 text-right font-semibold text-green-600">
                      Rp {formatRupiah(item.subtotal)}
                    </div>
                    <button
                      onClick={() => removeItem(item.medicine_id)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8 border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <span className="text-xl">📋</span>
                <h3 className="text-xl font-bold text-gray-800">Ringkasan Pesanan</h3>
              </div>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">
                      {item.nama_obat}{" "}
                      <span className="text-gray-400">x{item.jumlah}</span>
                    </span>
                    <span className="font-medium text-gray-800">
                      Rp {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    Rp {formatRupiah(totalPrice)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-md hover:shadow-lg ${
                  processing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "✅ Checkout"
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-4">
                *Pembayaran akan dikonfirmasi setelah checkout
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS untuk animasi */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes loadingProgress {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-slide-out {
          animation: slideOut 0.3s ease-out forwards;
        }
        
        .animate-loading-progress {
          animation: loadingProgress 2s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default CartPage;