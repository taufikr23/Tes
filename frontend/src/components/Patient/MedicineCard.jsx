import React, { useState } from "react";
import api from "../../utils/api";

const MedicineCard = ({ medicine, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToCart = async () => {
    if (medicine.stok === 0) {
      showToast(`Stok ${medicine.nama_obat} habis!`, "error");
      return;
    }
    setAdding(true);
    try {
      const res = await api.post("/medicines/check-stock", {
        id: medicine.id,
        quantity,
      });
      if (res.data.available) {
        onAddToCart({
          medicine_id: medicine.id,
          nama_obat: medicine.nama_obat,
          harga: medicine.harga,
          jumlah: quantity,
          subtotal: medicine.harga * quantity,
        });
        showToast(`${medicine.nama_obat} ditambahkan ke keranjang!`, "success");
      } else {
        showToast(`Stok tersisa: ${res.data.currentStock}`, "error");
      }
    } catch (err) {
      showToast(`Gagal menambah ke keranjang`, "error");
    } finally {
      setAdding(false);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/storage/${image}`;
  };

  const getDefaultImage = () => {
    const defaultImages = {
      Analgesik: "💊",
      Antipiretik: "🌡️",
      Antibiotik: "🦠",
      Antihistamin: "🤧",
      Antimabuk: "🚗",
      Antasida: "🍽️",
      Antibatik: "😷",
      Antiflu: "🤒",
      Vitamin: "🍊",
      Herbal: "🌿",
      Lainnya: "📦",
    };
    return defaultImages[medicine.kategori] || "💊";
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  return (
    <>
      {/* Notifikasi Toast - muncul di tengah atas, BUKAN ALERT */}
      {toast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[260px] ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            <span className="text-lg">
              {toast.type === "success" ? "✅" : "❌"}
            </span>
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full hover:scale-105">
        <div className="relative w-full h-44 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 overflow-hidden">
          {medicine.gambar && !imageError ? (
            <img
              src={getImageUrl(medicine.gambar)}
              alt={medicine.nama_obat}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl transform group-hover:scale-110 transition duration-300">
                {getDefaultImage()}
              </div>
            </div>
          )}

          <div
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md shadow-lg ${
              medicine.stok > 0
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-gradient-to-r from-red-500 to-red-600 text-white"
            }`}
          >
            {medicine.stok > 0 ? `📦 Stok: ${medicine.stok}` : "❌ Stok Habis"}
          </div>

          <div className="absolute bottom-3 left-3">
            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
              {getDefaultImage()} {medicine.kategori || "Umum"}
            </span>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-800 text-base mb-2 line-clamp-2 min-h-[48px] group-hover:text-green-600 transition-colors">
            {medicine.nama_obat}
          </h3>

          {medicine.deskripsi && (
            <p className="text-gray-500 text-xs mb-3 line-clamp-2">
              {medicine.deskripsi}
            </p>
          )}

          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xs text-gray-400">Harga</span>
              <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Rp {formatRupiah(medicine.harga)}
              </div>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                medicine.stok > 0 ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  medicine.stok > 0
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500"
                }`}
              ></div>
              <span
                className={`text-xs font-medium ${
                  medicine.stok > 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {medicine.stok > 0 ? "Tersedia" : "Habis"}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <div className="relative">
              <input
                type="number"
                min="1"
                max={medicine.stok}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(
                      medicine.stok,
                      Math.max(1, parseInt(e.target.value) || 1),
                    ),
                  )
                }
                className="w-16 border-2 border-gray-200 rounded-xl px-2 py-2 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={medicine.stok === 0}
              />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full text-white text-[10px] flex items-center justify-center">
                {quantity}
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding || medicine.stok === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {adding ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
              ) : (
                <>
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M18 13l1.5 6M9 21h6M12 18v3"
                    />
                  </svg>
                  <span>Tambah</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-transparent group-hover:border-green-300 transition duration-300"></div>
      </div>
    </>
  );
};

export default React.memo(MedicineCard);
