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
  const [doctorSchedules, setDoctorSchedules] = useState({});
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

  // Fungsi untuk mengambil jadwal dokter
  const fetchDoctorSchedules = async (doctorId) => {
    try {
      const response = await api.get(`/doctor-schedules/doctor/${doctorId}`);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
      return [];
    }
  };

  // Fetch doctors untuk rekomendasi
  const fetchDoctors = async () => {
    try {
      const response = await api.get("/doctors");
      console.log("Doctors data:", response.data);

      const { data: profiles } = await api.get("/profiles");

      const doctorsWithPhotos = (response.data.data || []).map((doctor) => {
        const profile = profiles.data.find((p) => p.id === doctor.user_id);
        return {
          ...doctor,
          foto_url: doctor.foto_url || profile?.foto_url || null,
        };
      });

      setDoctors(doctorsWithPhotos);

      // Ambil jadwal untuk setiap dokter
      const schedulesMap = {};
      for (const doctor of doctorsWithPhotos) {
        const schedules = await fetchDoctorSchedules(doctor.id);
        schedulesMap[doctor.id] = schedules;
      }
      setDoctorSchedules(schedulesMap);
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

  // Helper untuk jadwal
  const getDayName = (dayNumber) => {
    const days = {
      1: "Senin",
      2: "Selasa",
      3: "Rabu",
      4: "Kamis",
      5: "Jumat",
      6: "Sabtu",
      7: "Minggu",
    };
    return days[dayNumber] || "";
  };

  const formatTime = (time) => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex justify-between items-center flex-wrap gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Membantu Anda Merawat Kesehatan dengan Mudah
              </h1>
              <p className="text-emerald-100 text-lg">
                Konsultasi online dengan dokter profesional dan beli obat tanpa
                ribet
              </p>
            </div>
            <button
              onClick={() => navigate("/doctors")}
              className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
            >
              Mulai Konsultasi →
            </button>
          </div>
        </div>
      </div>

      {/* Layanan Kesehatan */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              📋 Layanan Kesehatan
            </h2>
            <p className="text-gray-400 text-sm">
              Pilih layanan kesehatan yang Anda butuhkan
            </p>
          </div>
          <button
            onClick={() => navigate("/medicines")}
            className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
          >
            Lihat semua →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition cursor-pointer"
            onClick={() => navigate("/consultation")}
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-semibold text-lg">Konsultasi Dokter</h3>
            <p className="text-emerald-100 text-sm mt-1">
              Chat dengan dokter ahli
            </p>
          </div>
          <div
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer"
            onClick={() => navigate("/medicines")}
          >
            <div className="text-4xl mb-3">💊</div>
            <h3 className="font-semibold text-gray-800">Beli Obat</h3>
            <p className="text-gray-400 text-sm mt-1">
              Obat asli harga terjangkau
            </p>
          </div>
          <div
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer"
            onClick={() => navigate("/orders")}
          >
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-semibold text-gray-800">Riwayat Pesanan</h3>
            <p className="text-gray-400 text-sm mt-1">Cek status pesanan</p>
          </div>
          <div
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer"
            onClick={() => navigate("/apply-doctor")}
          >
            <div className="text-4xl mb-3">👨‍⚕️</div>
            <h3 className="font-semibold text-gray-800">Jadi Dokter</h3>
            <p className="text-gray-400 text-sm mt-1">
              Bergabung sebagai mitra
            </p>
          </div>
        </div>
      </div>

      {/* Rekomendasi Dokter - DENGAN JADWAL */}
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                👨‍⚕️ Rekomendasi Dokter
              </h2>
              <p className="text-gray-400 text-sm">
                Dokter terbaik untuk kesehatan Anda
              </p>
            </div>
            <button
              onClick={() => navigate("/doctors")}
              className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
            >
              Lihat semua →
            </button>
          </div>

          {doctorsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <div className="text-5xl mb-3">👨‍⚕️</div>
              <p className="text-gray-400">Belum ada dokter yang terdaftar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {doctors.slice(0, 4).map((doctor) => {
                const schedules = doctorSchedules[doctor.id] || [];
                const today = new Date().getDay();
                const todayIndex = today === 0 ? 7 : today;
                const todaySchedule = schedules.find(
                  (s) => s.hari === todayIndex && s.status === "aktif",
                );

                return (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col"
                  >
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
                      <div className="flex justify-between items-start">
                        <img
                          src={
                            doctor.foto_url ||
                            getAvatarUrl(doctor.nama_dokter || "D", "ffffff")
                          }
                          alt={doctor.nama_dokter}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getAvatarUrl(
                              doctor.nama_dokter || "D",
                              "ffffff",
                            );
                          }}
                        />
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                          ⭐ 4.9
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mt-3 line-clamp-1">
                        {doctor.nama_dokter}
                      </h3>
                      <p className="text-emerald-100 text-sm line-clamp-1">
                        {doctor.spesialis}
                      </p>
                    </div>

                    <div className="p-4 flex-1">
                      {/* Harga */}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 text-sm">
                          💰 Biaya Konsultasi
                        </span>
                        <span className="text-emerald-600 font-bold">
                          Rp {formatRupiah(doctor.biaya_konsultasi)}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-500 text-sm">⭐ Rating</span>
                        <span className="text-emerald-600 font-semibold">
                          4.9 (100%)
                        </span>
                      </div>

                      {/* JADWAL DOKTER */}
                      <div className="border-t border-gray-100 pt-3 mt-2">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-xs font-semibold text-gray-700">
                            📅 Jadwal Praktik:
                          </span>
                        </div>

                        {schedules.length === 0 ? (
                          <p className="text-xs text-gray-400">
                            Jadwal belum tersedia
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {/* Tampilkan 2 jadwal pertama */}
                            {schedules.slice(0, 2).map((schedule, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-gray-600 font-medium">
                                  {getDayName(schedule.hari)}
                                </span>
                                <span className="text-gray-500">
                                  {formatTime(schedule.jam_mulai)} -{" "}
                                  {formatTime(schedule.jam_selesai)}
                                </span>
                                {schedule.status === "aktif" ? (
                                  <span className="text-green-500 text-[10px]">
                                    ● Tersedia
                                  </span>
                                ) : (
                                  <span className="text-red-400 text-[10px]">
                                    ● Libur
                                  </span>
                                )}
                              </div>
                            ))}
                            {schedules.length > 2 && (
                              <p className="text-[10px] text-gray-400 text-center pt-1">
                                +{schedules.length - 2} jadwal lainnya
                              </p>
                            )}
                          </div>
                        )}

                        {/* Jadwal Hari Ini */}
                        {todaySchedule && (
                          <div className="mt-2 bg-emerald-50 rounded-lg p-1.5 text-center">
                            <p className="text-[10px] text-emerald-600 font-medium">
                              🟢 Tersedia hari ini •{" "}
                              {formatTime(todaySchedule.jam_mulai)} -{" "}
                              {formatTime(todaySchedule.jam_selesai)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tombol Konsultasi */}
                    <div className="p-4 pt-0 border-t border-gray-100 mt-auto">
                      <button
                        onClick={() => handleConsultation(doctor)}
                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                      >
                        <span>💬</span> Konsultasi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Kategori Obat */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              📂 Kategori Obat
            </h2>
            <p className="text-gray-400 text-sm">
              Pilih berdasarkan jenis obat
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="w-10 h-10 rounded-full bg-white shadow-md text-gray-600 hover:bg-emerald-50 transition"
            >
              ◀
            </button>
            <button
              onClick={scrollRight}
              className="w-10 h-10 rounded-full bg-white shadow-md text-gray-600 hover:bg-emerald-50 transition"
            >
              ▶
            </button>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition text-sm font-medium ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300"
              }`}
            >
              {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-3">
          Menampilkan{" "}
          <span className="font-medium text-emerald-600">
            {filteredMedicines.length}
          </span>{" "}
          obat
        </div>
      </div>

      {/* Daftar Obat */}
      <div className="container mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-emerald-600"
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
                <h2 className="font-semibold text-gray-800">
                  💊 Obat Tersedia
                </h2>
              </div>
              <button
                onClick={() => navigate("/medicines")}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Lihat semua →
              </button>
            </div>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-2">📦</div>
                <p className="text-gray-400">
                  Tidak ada obat dalam kategori {selectedCategory}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentItems.map((medicine) => (
                    <MedicineCard
                      key={medicine.id}
                      medicine={medicine}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                    >
                      ← Sebelumnya
                    </button>
                    <span className="text-sm text-gray-500">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
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
  );
};

export default DashboardPatient;
