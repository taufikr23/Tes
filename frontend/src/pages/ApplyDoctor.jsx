import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api, { supabase } from "../utils/api";

const ApplyDoctor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nama_dokter: "",
    spesialis: "",
    biaya_konsultasi: "",
    jadwal_praktik: "",
    foto: "",
  });
  const [loading, setLoading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchMyApplications = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/doctor-applications/my/${user.id}`);
      setMyApplications(res.data.data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setFetchingStatus(false);
    }
  };

  // Setup realtime listener untuk perubahan status pengajuan
  useEffect(() => {
    if (!user || user.role === "dokter") return;

    // Subscribe ke perubahan di tabel doctor_applications
    const subscription = supabase
      .channel("doctor_applications_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "doctor_applications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Application updated:", payload);
          const newStatus = payload.new.status;

          if (newStatus === "approved") {
            alert(
              "🎉 SELAMAT! Pengajuan Anda sebagai dokter telah DISETUJUI!\n\nSilakan login kembali untuk mengakses dashboard dokter.",
            );

            // Logout dan redirect ke login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          } else if (newStatus === "rejected") {
            alert(
              "❌ Pengajuan Anda sebagai dokter ditolak. Silakan cek alasan penolakan di riwayat pengajuan.",
            );
            fetchMyApplications();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/doctor-applications", {
        user_id: user.id,
        ...form,
        biaya_konsultasi: parseFloat(form.biaya_konsultasi),
      });

      if (res.data.success) {
        setMessage({ type: "success", text: res.data.message });
        setForm({
          nama_dokter: "",
          spesialis: "",
          biaya_konsultasi: "",
          jadwal_praktik: "",
          foto: "",
        });
        fetchMyApplications();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Gagal mengirim pengajuan",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [user]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        icon: "⏳",
        label: "Menunggu Persetujuan",
      },
      approved: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        icon: "✓",
        label: "Disetujui",
      },
      rejected: {
        bg: "bg-rose-50",
        text: "text-rose-700",
        icon: "✗",
        label: "Ditolak",
      },
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasPendingApplication = myApplications.some(
    (app) => app.status === "pending",
  );
  const isAlreadyDoctor = user?.role === "dokter";

  if (isAlreadyDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-16">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">
              Anda Sudah Menjadi Dokter
            </h2>
            <p className="text-gray-500 mb-6">
              Anda sudah terdaftar sebagai dokter di T-Medic.
            </p>
            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl transition font-medium"
            >
              Buka Dashboard Dokter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">
            Ajukan Menjadi Dokter
          </h1>
          <p className="text-gray-500">
            Bergabunglah menjadi mitra dokter T-Medic dan layani pasien secara
            online
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kolom Kiri - Form Pengajuan */}
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Formulir Pengajuan
                  </h2>
                  <p className="text-emerald-100 text-sm">
                    Isi data diri Anda sebagai dokter
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {message && (
                <div
                  className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
                    message.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  <span className="text-xl">
                    {message.type === "success" ? "✓" : "⚠"}
                  </span>
                  <p className="text-sm flex-1">{message.text}</p>
                </div>
              )}

              {hasPendingApplication ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <svg
                      className="w-10 h-10 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-amber-700 mb-2">
                    Pengajuan Sedang Diproses
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Anda sudah memiliki pengajuan yang sedang menunggu
                    persetujuan admin. Silakan tunggu konfirmasi dari admin.
                  </p>
                  <button
                    onClick={() => navigate("/patient/dashboard")}
                    className="mt-6 text-emerald-600 hover:text-emerald-700 text-sm font-medium inline-flex items-center gap-1"
                  >
                    ← Kembali ke Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Nama Dokter
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        👨‍⚕️
                      </span>
                      <input
                        type="text"
                        name="nama_dokter"
                        value={form.nama_dokter}
                        onChange={handleChange}
                        placeholder="Dr. [Nama Anda]"
                        className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Spesialis
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        🏥
                      </span>
                      <input
                        type="text"
                        name="spesialis"
                        value={form.spesialis}
                        onChange={handleChange}
                        placeholder="Contoh: Dokter Umum, Spesialis Jantung"
                        className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Biaya Konsultasi
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        name="biaya_konsultasi"
                        value={form.biaya_konsultasi}
                        onChange={handleChange}
                        placeholder="100000"
                        className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Jadwal Praktik
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        📅
                      </span>
                      <input
                        type="text"
                        name="jadwal_praktik"
                        value={form.jadwal_praktik}
                        onChange={handleChange}
                        placeholder="Senin-Jumat, 09:00-17:00"
                        className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Foto Profil (URL)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        📷
                      </span>
                      <input
                        type="text"
                        name="foto"
                        value={form.foto}
                        onChange={handleChange}
                        placeholder="https://example.com/foto-dokter.jpg"
                        className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
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
                        Memproses...
                      </span>
                    ) : (
                      "Ajukan Menjadi Dokter"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Kolom Kanan - Riwayat Pengajuan */}
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Riwayat Pengajuan
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Status pengajuan Anda sebagai dokter
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-[500px] overflow-y-auto">
              {fetchingStatus ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-gray-400 mt-3">Memuat riwayat...</p>
                </div>
              ) : myApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium">
                    Belum Ada Pengajuan
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    Silakan isi formulir di samping
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((app) => {
                    const statusStyle = getStatusBadge(app.status);
                    return (
                      <div
                        key={app.id}
                        className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {app.nama_dokter}
                            </h3>
                            <p className="text-emerald-600 text-sm">
                              {app.spesialis}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            <span className="mr-1">{statusStyle.icon}</span>
                            {statusStyle.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-400 text-xs">
                              💰 Biaya Konsultasi
                            </p>
                            <p className="font-semibold text-sm">
                              Rp {app.biaya_konsultasi?.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-400 text-xs">
                              📅 Jadwal Praktik
                            </p>
                            <p className="font-medium text-xs">
                              {app.jadwal_praktik}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{formatDate(app.created_at)}</span>
                        </div>

                        {app.status === "rejected" && app.pesan_penolakan && (
                          <div className="mt-3 p-3 bg-rose-50 rounded-xl">
                            <p className="text-rose-600 text-xs font-medium mb-1">
                              Alasan Penolakan:
                            </p>
                            <p className="text-rose-600 text-sm">
                              {app.pesan_penolakan}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyDoctor;
