import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import ConsultationForm from "../components/Patient/ConsultationForm";
import MedicineCard from "../components/Patient/MedicineCard";

const DashboardPatient = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // CEK ROLE
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      if (user?.role === "dokter") {
        navigate("/doctor/dashboard", { replace: true });
        return;
      }
      if (user?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      if (user?.role !== "pasien") {
        logout();
        navigate("/login");
      }
    };
    if (user) {
      checkRole();
    }
  }, [user, navigate, logout]);

  // Ambil jumlah pesan belum dibaca
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/chat/unread/count");
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  // Ambil jumlah pesanan yang menunggu verifikasi admin
  const fetchPendingPaymentCount = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/orders/user/${user.id}`);
      const orders = res.data.data || [];
      const pendingCount = orders.filter(
        (order) =>
          order.status_pembayaran === "pending" ||
          order.status_pembayaran === "waiting_payment",
      ).length;
      setPendingPaymentCount(pendingCount);
    } catch (err) {
      console.error("Error fetching pending payments:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchPendingPaymentCount();

    // Auto refresh setiap 3 detik
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingPaymentCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMedicines.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const fetchMedicines = useCallback(async () => {
    try {
      const response = await api.get("/medicines");
      setMedicines(response.data.data);
      setFilteredMedicines(response.data.data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  useEffect(() => {
    if (selectedCategory === "Semua") {
      setFilteredMedicines(medicines);
    } else {
      setFilteredMedicines(
        medicines.filter((m) => m.kategori === selectedCategory),
      );
    }
    setCurrentPage(1);
  }, [selectedCategory, medicines]);

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

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Banner dengan 3 button sejajar */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight">
                Selamat Datang, {user?.nama?.split(" ")[0]}!
              </h1>
              <p className="text-emerald-100 text-sm">
                Konsultasi kesehatan online dan beli obat dengan mudah
              </p>
            </div>
            <div className="flex gap-3">
              {/* Tombol Keranjang */}
              <button
                onClick={() => navigate("/cart")}
                className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition backdrop-blur-sm relative"
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
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cart.reduce((sum, item) => sum + item.jumlah, 0)}
                  </span>
                )}
              </button>
              {/* Tombol Riwayat Pembelian dengan NOTIFIKASI MERAH (tanpa animasi) */}
              <button
                onClick={() => navigate("/orders")}
                className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition backdrop-blur-sm relative"
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {pendingPaymentCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingPaymentCount > 99 ? "99+" : pendingPaymentCount}
                  </span>
                )}
              </button>
              {/* Tombol Riwayat Chat dengan NOTIFIKASI MERAH (tanpa animasi) */}
              <button
                onClick={() => navigate("/consultations/history")}
                className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition backdrop-blur-sm relative"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - 2 Kolom (Kiri: Konsultasi, Kanan: Obat) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kolom 1: Form Konsultasi */}
          <div className="space-y-6">
            {/* Konsultasi Card */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                <h2 className="font-semibold text-emerald-800 flex items-center gap-2">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Konsultasi Kesehatan
                </h2>
              </div>
              <div className="p-5">
                <ConsultationForm onSuccess={() => {}} />
              </div>
            </div>
          </div>

          {/* Kolom 2: Kategori & Obat */}
          <div className="space-y-6">
            {/* Categories Card */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-800">
                    📂 Kategori Obat
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={scrollLeft}
                      className="p-1 rounded-full bg-white shadow-sm text-gray-500 hover:bg-emerald-100 transition"
                    >
                      ◀
                    </button>
                    <button
                      onClick={scrollRight}
                      className="p-1 rounded-full bg-white shadow-sm text-gray-500 hover:bg-emerald-100 transition"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div
                  ref={scrollContainerRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full whitespace-nowrap transition text-xs font-medium ${selectedCategory === cat ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-emerald-100"}`}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Menampilkan{" "}
                  <span className="font-medium text-emerald-600">
                    {filteredMedicines.length}
                  </span>{" "}
                  obat dari kategori {selectedCategory}
                </div>
              </div>
            </div>

            {/* Obat Tersedia Card */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-emerald-800">
                    💊 Obat Tersedia
                  </h3>
                  <button
                    onClick={() => navigate("/medicines")}
                    className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                  >
                    Lihat semua →
                  </button>
                </div>
              </div>

              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-pulse text-emerald-400">
                      Memuat data obat...
                    </div>
                  </div>
                ) : currentItems.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📦</div>
                      <p className="text-gray-400 text-sm">
                        Tidak ada obat dalam kategori {selectedCategory}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentItems.slice(0, 4).map((medicine) => (
                        <MedicineCard
                          key={medicine.id}
                          medicine={medicine}
                          onAddToCart={addToCart}
                        />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-3 mt-4 pt-3 border-t border-emerald-100">
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                        >
                          ← Sebelumnya
                        </button>
                        <span className="text-xs text-gray-500">
                          Halaman{" "}
                          <span className="font-medium text-emerald-600">
                            {currentPage}
                          </span>{" "}
                          dari {totalPages}
                        </span>
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                        >
                          Selanjutnya →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default DashboardPatient;
