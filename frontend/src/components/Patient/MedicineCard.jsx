import React, { useState } from "react";
import api from "../../utils/api";

const MedicineCard = ({ medicine, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = async () => {
    if (medicine.stok === 0) {
      alert("Stok habis!");
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
      } else {
        alert(`Stok tidak cukup. Stok tersisa: ${res.data.currentStock}`);
      }
    } catch (err) {
      alert("Gagal menambah ke keranjang");
    } finally {
      setAdding(false);
    }
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
    };
    return defaultImages[medicine.kategori] || "💊";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
      {/* Foto Obat */}
      <div className="h-20 bg-gradient-to-r from-cyan-50 to-teal-50 flex items-center justify-center">
        {medicine.gambar && !imageError ? (
          <img
            src={medicine.gambar}
            alt={medicine.nama_obat}
            className="h-12 w-12 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-2xl">{getDefaultImage()}</div>
        )}
      </div>

      <div className="p-2">
        {/* Nama & Kategori */}
        <div className="flex justify-between items-start gap-1 mb-1">
          <h3 className="text-xs font-semibold text-gray-800 line-clamp-1 flex-1">
            {medicine.nama_obat}
          </h3>
          <span className="text-[9px] bg-teal-100 text-teal-700 px-1 py-0.5 rounded-full whitespace-nowrap">
            {medicine.kategori}
          </span>
        </div>

        {/* Harga */}
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold text-cyan-600">
            Rp {medicine.harga?.toLocaleString("id-ID")}
          </span>
          <span
            className={`text-[10px] ${medicine.stok > 0 ? "text-green-600" : "text-red-600"}`}
          >
            Stok: {medicine.stok}
          </span>
        </div>

        {/* Quantity & Button */}
        <div className="flex gap-1">
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
            className="w-10 border border-gray-200 rounded-md px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            onClick={handleAddToCart}
            disabled={adding || medicine.stok === 0}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-0.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-medium"
          >
            {adding ? "..." : "🛒"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicineCard);
