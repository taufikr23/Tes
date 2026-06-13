import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import MedicineCard from "../components/Patient/MedicineCard";

const MedicinesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState([]);
  const itemsPerPage = 12;

  // Daftar kategori
  const categories = [
    "Semua",
    "Analgesik",
    "Antipiretik",
    "Antibiotik",
    "Antihistamin",
    "Antimabuk",
    "Antasida",
    "Antibatik",
    "Antiflu",
    "Antidepresan",
    "Antijamur",
    "Antivirus",
    "Vitamin",
    "Kortikosteroid",
    "Diuretik",
    "Antihipertensi",
    "Antidiabetes",
    "Kolesterol",
    "Salep",
    "Herbal",
    "Lainnya",
  ];

  // Icon untuk kategori
  const getCategoryIcon = (cat) => {
    const icons = {
      Analgesik: "💊",
      Antipiretik: "🌡️",
      Antibiotik: "🦠",
      Antihistamin: "🤧",
      Antimabuk: "🚗",
      Antasida: "🍽️",
      Antibatik: "😷",
      Antiflu: "🤒",
      Antidepresan: "😔",
      Antijamur: "🍄",
      Antivirus: "🦠",
      Vitamin: "🍊",
      Kortikosteroid: "💉",
      Diuretik: "💧",
      Antihipertensi: "❤️",
      Antidiabetes: "🩸",
      Kolesterol: "🫀",
      Salep: "🧴",
      Herbal: "🌿",
      Lainnya: "📦",
      Semua: "📦",
    };
    return icons[cat] || "💊";
  };

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/medicines");
      setMedicines(response.data.data);
      setFilteredMedicines(response.data.data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter berdasarkan pencarian dan kategori
  useEffect(() => {
    let result = medicines;

    // Filter by search
    if (searchTerm) {
      result = result.filter(
        (m) =>
          m.nama_obat.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.kategori?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by category
    if (selectedCategory !== "Semua") {
      result = result.filter((m) => m.kategori === selectedCategory);
    }

    setFilteredMedicines(result);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, medicines]);

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i.medicine_id === item.medicine_id);
    let newCart;
    if (existingItem) {
      newCart = cart.map((i) =>
        i.medicine_id === item.medicine_id
          ? {
              ...i,
              jumlah: i.jumlah + item.jumlah,
              subtotal: (i.jumlah + item.jumlah) * i.harga,
            }
          : i,
      );
    } else {
      newCart = [...cart, item];
    }
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCart(newCart);
    alert(`${item.nama_obat} ditambahkan ke keranjang!`);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMedicines.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-emerald-800">
              💊 Daftar Obat
            </h1>
            <p className="text-gray-500 text-sm">
              Temukan obat yang Anda butuhkan
            </p>
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="relative bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-2"
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M18 13l1.5 6M9 21h6M12 18v3"
              />
            </svg>
            Keranjang
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalCartItems > 99 ? "99+" : totalCartItems}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari obat atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Categories - Horizontal Scroll */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              📂 Kategori Obat
            </h3>
            <div className="flex gap-1">
              <button
                onClick={scrollLeft}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                ◀
              </button>
              <button
                onClick={scrollRight}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                ▶
              </button>
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition text-sm font-medium ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-emerald-100"
                }`}
              >
                {getCategoryIcon(cat)} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-emerald-800">
              💊 Semua Obat
            </h3>
            <p className="text-sm text-gray-400">
              {filteredMedicines.length} obat ditemukan
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-emerald-400">
                Memuat data obat...
              </div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-gray-400">Tidak ada obat yang ditemukan</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentItems.map((medicine) => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={medicine}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    ← Sebelumnya
                  </button>
                  <span className="text-sm text-gray-500">
                    Halaman{" "}
                    <span className="font-medium text-emerald-600">
                      {currentPage}
                    </span>{" "}
                    dari {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default MedicinesPage;
