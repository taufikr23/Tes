import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import MedicineCard from "../components/Patient/MedicineCard";

const DashboardPatient = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // CEK ROLE
  useEffect(() => {
    if (!user) return;
    if (user.role === "dokter") {
      navigate("/doctor/dashboard", { replace: true });
      return;
    }
    if (user.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
  }, [user, navigate]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/chat/unread/count");
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

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
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingPaymentCount();
    }, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch doctors LANGSUNG dari tabel doctors dengan foto
  const fetchDoctors = async () => {
    try {
      const response = await api.get("/doctors");
      console.log("Doctors data from API:", response.data);

      // Data dokter sudah lengkap dari backend (termasuk foto dari join)
      const doctorsList = response.data.data || [];

      // Proses foto_url jika perlu (tambahkan base URL jika path relatif)
      const processedDoctors = doctorsList.map((doctor) => ({
        ...doctor,
        foto: doctor.foto
          ? doctor.foto.startsWith("http")
            ? doctor.foto
            : `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/storage/${doctor.foto}`
          : null,
      }));

      setDoctors(processedDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // FUNGSI KONSULTASI - LANGSUNG KE HALAMAN KONSULTASI
  const handleConsultation = (doctor) => {
    navigate("/consultation", {
      state: {
        doctorId: doctor.id,
        doctorName: doctor.nama_dokter,
        doctorSpecialty: doctor.spesialis,
        doctorPrice: doctor.biaya_konsultasi,
        doctorPhoto: doctor.foto_url,
      },
    });
  };

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
    window.dispatchEvent(new Event("cartUpdated"));
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

  const getAvatarUrl = (name, bg = "0891b2") => {
    return `https://ui-avatars.com/api/?background=${bg}&color=fff&name=${encodeURIComponent(name || "U")}&length=1&bold=true`;
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section dengan Background Hijau */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          ></div>
        </div>
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex justify-between items-center flex-wrap gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Selamat Datang,{" "}
                <span className="text-green-200">
                  {user?.nama || "Pasien"}!
                </span>
              </h1>
              <p className="text-green-100 text-lg">
                Membantu Anda Merawat Kesehatan dengan Mudah
              </p>
              <p className="text-green-100/80 text-sm mt-2">
                Konsultasi online dengan dokter profesional dan beli obat tanpa
                ribet
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/cart")}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition flex items-center gap-2"
              >
                🛒 Keranjang ({cart.length})
              </button>
              <button
                onClick={() => navigate("/doctors")}
                className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition hover:bg-green-50"
              >
                Mulai Konsultasi →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Layanan Kesehatan */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">📋</span> Layanan Kesehatan
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Pilih layanan kesehatan yang Anda butuhkan
            </p>
          </div>
          <button
            onClick={() => navigate("/medicines")}
            className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center gap-1"
          >
            Lihat semua <span>→</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            onClick={() => navigate("/consultation")}
          >
            <div className="text-5xl mb-3">💬</div>
            <h3 className="font-semibold text-lg">Konsultasi Dokter</h3>
            <p className="text-green-100 text-sm mt-1">
              Chat dengan dokter ahli
            </p>
            {unreadCount > 0 && (
              <span className="inline-block mt-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full">
                {unreadCount} pesan baru
              </span>
            )}
          </div>
          <div
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            onClick={() => navigate("/medicines")}
          >
            <div className="text-5xl mb-3">💊</div>
            <h3 className="font-semibold text-gray-800">Beli Obat</h3>
            <p className="text-gray-400 text-sm mt-1">
              Obat asli harga terjangkau
            </p>
          </div>
          <div
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            onClick={() => navigate("/orders")}
          >
            <div className="text-5xl mb-3">📦</div>
            <h3 className="font-semibold text-gray-800">Riwayat Pesanan</h3>
            <p className="text-gray-400 text-sm mt-1">Cek status pesanan</p>
            {/* Notifikasi pendingPaymentCount dihapus */}
          </div>
          <div
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            onClick={() => navigate("/apply-doctor")}
          >
            <div className="text-5xl mb-3">👨‍⚕️</div>
            <h3 className="font-semibold text-gray-800">Jadi Dokter</h3>
            <p className="text-gray-400 text-sm mt-1">
              Bergabung sebagai mitra
            </p>
          </div>
        </div>
      </div>

      {/* Rekomendasi Dokter */}
      <div className="py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 via-emerald-100/30 to-teal-100/50"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">👨‍⚕️</span> Rekomendasi Dokter
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Dokter terbaik untuk kesehatan Anda
              </p>
            </div>
            <button
              onClick={() => navigate("/doctors")}
              className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center gap-1"
            >
              Lihat semua <span>→</span>
            </button>
          </div>

          {doctorsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <div className="text-6xl mb-3">👨‍⚕️</div>
              <p className="text-gray-400">Belum ada dokter yang terdaftar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctors.slice(0, 4).map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:scale-105 flex flex-col group"
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white relative">
                    <div className="flex justify-between items-start">
                      <div className="relative">
                        {doctor.foto ? (
                          <img
                            src={doctor.foto}
                            alt={doctor.nama_dokter}
                            className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getAvatarUrl(
                                doctor.nama_dokter || "D",
                                "ffffff",
                              );
                            }}
                          />
                        ) : (
                          <img
                            src={getAvatarUrl(
                              doctor.nama_dokter || "D",
                              "ffffff",
                            )}
                            alt={doctor.nama_dokter}
                            className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                          />
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
                        ⭐ 4.9
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mt-3 line-clamp-1">
                      {doctor.nama_dokter}
                    </h3>
                    <p className="text-green-100 text-sm line-clamp-1">
                      {doctor.spesialis}
                    </p>
                  </div>

                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500 text-sm">
                        💰 Biaya Konsultasi
                      </span>
                      <span className="text-green-600 font-bold">
                        Rp {formatRupiah(doctor.biaya_konsultasi)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-500 text-sm">⭐ Rating</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★★★★★</span>
                        <span className="text-gray-500 text-sm">(4.9)</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 mt-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>📅</span> Jadwal:{" "}
                        {doctor.jadwal_praktik || "Hubungi dokter"}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <span>👥</span> Pasien: 100+ orang
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-gray-100 mt-auto">
                    <button
                      onClick={() => handleConsultation(doctor)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>💬</span> Konsultasi Sekarang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kategori Obat */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">📂</span> Kategori Obat
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Pilih berdasarkan jenis obat
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="w-10 h-10 rounded-full bg-white shadow-md text-gray-600 hover:bg-green-500 hover:text-white transition-all"
            >
              ◀
            </button>
            <button
              onClick={scrollRight}
              className="w-10 h-10 rounded-full bg-white shadow-md text-gray-600 hover:bg-green-500 hover:text-white transition-all"
            >
              ▶
            </button>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin"
          style={{ scrollbarWidth: "thin" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition-all text-sm font-medium ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:shadow-md"
              }`}
            >
              {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-3">
          Menampilkan{" "}
          <span className="font-medium text-green-600">
            {filteredMedicines.length}
          </span>{" "}
          obat
        </div>
      </div>

      {/* Daftar Obat */}
      <div className="container mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">
                    💊 Obat Tersedia
                  </h2>
                  <p className="text-gray-500 text-xs">
                    Obat asli, terjamin kualitasnya
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/medicines")}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                Lihat semua <span>→</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-400 mt-3">Memuat data obat...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3">📦</div>
                <p className="text-gray-400">
                  Tidak ada obat dalam kategori {selectedCategory}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {currentItems.map((medicine) => (
                    <MedicineCard
                      key={medicine.id}
                      medicine={medicine}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                      }`}
                    >
                      ← Sebelumnya
                    </button>
                    <div className="flex items-center gap-2">
                      {[...Array(totalPages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentPage(idx + 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                            currentPage === idx + 1
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-green-100"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
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
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <span className="font-bold text-lg">T-Medic</span>
              </div>
              <p className="text-gray-400 text-sm">
                Solusi kesehatan modern untuk Anda
              </p>
            </div>
            <div className="text-center text-gray-400 text-sm">
              © 2024 T-Medic. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPatient;
