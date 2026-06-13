import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

const CartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    console.log("Loaded cart:", savedCart);
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
  };

  const removeItem = (medicineId) => {
    const newCart = cart.filter((item) => item.medicine_id !== medicineId);
    saveCart(newCart);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    console.log("=== CHECKOUT START ===");
    console.log("User:", user);
    console.log("Cart items:", cart);
    console.log("Total price:", totalPrice);

    if (!user) {
      setError("Silakan login terlebih dahulu");
      alert("Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      setError("Keranjang belanja kosong");
      alert("Keranjang belanja kosong");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Pastikan setiap item memiliki format yang benar
      const validItems = cart.map((item) => ({
        medicine_id: item.medicine_id,
        jumlah: parseInt(item.jumlah),
        subtotal: parseFloat(item.subtotal),
      }));

      const orderData = {
        user_id: user.id,
        items: validItems,
        total_harga: parseFloat(totalPrice),
      };

      console.log("Sending order data:", JSON.stringify(orderData, null, 2));

      const response = await api.post("/orders", orderData);

      console.log("Response from server:", response.data);

      if (response.data.success) {
        localStorage.removeItem("cart");
        alert("✅ Pesanan berhasil dibuat! Silakan lakukan pembayaran.");
        navigate(`/payment/${response.data.data.id}`);
      } else {
        setError(response.data.message || "Gagal membuat pesanan");
        alert(response.data.message || "Gagal membuat pesanan");
      }
    } catch (err) {
      console.error("=== CHECKOUT ERROR ===");
      console.error("Error:", err);
      console.error("Error response:", err.response?.data);

      let errorMessage = "Gagal checkout. ";
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Silakan coba lagi.";
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition"
          >
            Lihat Daftar Obat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Keranjang Belanja</h1>
        <button
          onClick={() => navigate("/medicines")}
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          + Tambah Obat
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {cart.map((item) => (
                <div
                  key={item.medicine_id}
                  className="p-4 flex items-center gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {item.nama_obat}
                    </h3>
                    <p className="text-emerald-600">
                      Rp {formatRupiah(item.harga)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.medicine_id, -1)}
                      className="w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.jumlah}</span>
                    <button
                      onClick={() => updateQuantity(item.medicine_id, 1)}
                      className="w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-24 text-right font-semibold">
                    Rp {formatRupiah(item.subtotal)}
                  </div>
                  <button
                    onClick={() => removeItem(item.medicine_id)}
                    className="text-red-500 hover:text-red-600"
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
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
            <h3 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h3>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.nama_obat}{" "}
                    <span className="text-gray-500">x{item.jumlah}</span>
                  </span>
                  <span>Rp {formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-emerald-600">
                  Rp {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {processing ? "Memproses..." : "✅ Checkout"}
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              *Pembayaran akan dikonfirmasi setelah checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
