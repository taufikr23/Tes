import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

// Komponen Toast Notification
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
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
        <svg
          className="w-5 h-5 text-green-600 animate-spin"
          fill="none"
          stroke="currentColor"
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
      );
    }
    switch (toast.type) {
      case "success":
        return (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    if (toast.isLoading) return "bg-blue-50 border-blue-500";
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-500";
      case "error":
        return "bg-red-50 border-red-500";
      default:
        return "bg-blue-50 border-blue-500";
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-l-4 ${getBgColor()} transition-all duration-300 transform w-80 ${isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}`}
    >
      <div className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">{toast.message}</p>
        </div>
        {!toast.isLoading && (
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {toast.isLoading && (
        <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ animation: "loadingProgress 2s linear forwards" }}
          ></div>
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, isLoading: false }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  };

  const showLoadingToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, isLoading: true }]);
    return id;
  };

  const updateLoadingToast = (id, message, type = "success") => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, message, type, isLoading: false } : toast,
      ),
    );
    setTimeout(
      () => setToasts((prev) => prev.filter((toast) => toast.id !== id)),
      3000,
    );
  };

  // Form edit profil
  const [formData, setFormData] = useState({
    nama: "",
    nomor_telepon: "",
    alamat: "",
    foto_url: "",
    email_notifikasi: true,
  });

  // Form edit dokter (HANYA untuk role dokter)
  const [doctorForm, setDoctorForm] = useState({
    nama_dokter: "",
    spesialis: "",
    biaya_konsultasi: "",
    jadwal_praktik: "",
    foto: "",
  });

  // Form ganti password
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Hapus akun
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
    // Hanya fetch data dokter jika role-nya adalah dokter
    if (user?.role === "dokter") {
      fetchDoctorData();
    } else {
      setLoading(false);
    }
    fetchActivityLogs();
  }, [user?.role]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profiles/me");
      setProfile(res.data.data);
      setFormData({
        nama: res.data.data.nama || "",
        nomor_telepon: res.data.data.nomor_telepon || "",
        alamat: res.data.data.alamat || "",
        foto_url: res.data.data.foto_url || "",
        email_notifikasi: res.data.data.email_notifikasi !== false,
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchDoctorData = async () => {
    // Pastikan hanya dokter yang bisa mengakses
    if (user?.role !== "dokter") {
      console.log("Bukan dokter, tidak bisa fetch data dokter");
      return;
    }

    try {
      const doctorsRes = await api.get("/doctors");
      const doctor = doctorsRes.data.data?.find((d) => d.user_id === user.id);

      if (doctor) {
        setDoctorData(doctor);
        setDoctorForm({
          nama_dokter: doctor.nama_dokter || "",
          spesialis: doctor.spesialis || "",
          biaya_konsultasi: doctor.biaya_konsultasi || "",
          jadwal_praktik: doctor.jadwal_praktik || "",
          foto: doctor.foto || "",
        });
      } else {
        setDoctorData(null);
      }
    } catch (err) {
      console.error("Error fetching doctor data:", err);
      setDoctorData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await api.get("/profiles/activity-logs");
      setActivityLogs(res.data.data || []);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    }
  };

  const handleProfileChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleDoctorChange = (e) => {
    setDoctorForm({ ...doctorForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordError("");
    setPasswordSuccess("");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const toastId = showLoadingToast("🔄 Menyimpan perubahan profil...");
    try {
      await api.put("/profiles/me", formData);
      updateLoadingToast(toastId, "✅ Profil berhasil diperbarui!", "success");
      fetchProfile();
      const updatedUser = {
        ...user,
        nama: formData.nama,
        foto_url: formData.foto_url,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      updateLoadingToast(
        toastId,
        err.response?.data?.message || "❌ Gagal memperbarui profil",
        "error",
      );
    }
  };

  const saveDoctorProfile = async (e) => {
    e.preventDefault();

    // PENTING: Pastikan hanya dokter yang bisa menyimpan profil dokter
    if (user?.role !== "dokter") {
      showToast(
        "❌ Anda tidak memiliki akses untuk mengubah profil dokter",
        "error",
      );
      return;
    }

    setSaving(true);

    // Validasi
    if (!doctorForm.nama_dokter.trim()) {
      showToast("❌ Nama dokter harus diisi", "error");
      setSaving(false);
      return;
    }
    if (!doctorForm.spesialis.trim()) {
      showToast("❌ Spesialis harus diisi", "error");
      setSaving(false);
      return;
    }
    if (
      !doctorForm.biaya_konsultasi ||
      parseFloat(doctorForm.biaya_konsultasi) <= 0
    ) {
      showToast("❌ Biaya konsultasi harus diisi dengan benar", "error");
      setSaving(false);
      return;
    }
    if (!doctorForm.jadwal_praktik.trim()) {
      showToast("❌ Jadwal praktik harus diisi", "error");
      setSaving(false);
      return;
    }

    const toastId = showLoadingToast("🔄 Menyimpan profil dokter...");

    try {
      let doctor = doctorData;

      if (!doctor) {
        const doctorsRes = await api.get("/doctors");
        doctor = doctorsRes.data.data?.find((d) => d.user_id === user.id);
      }

      if (!doctor || !doctor.id) {
        throw new Error("Data dokter tidak ditemukan");
      }

      const updateData = {
        nama_dokter: doctorForm.nama_dokter,
        spesialis: doctorForm.spesialis,
        biaya_konsultasi: parseFloat(doctorForm.biaya_konsultasi),
        jadwal_praktik: doctorForm.jadwal_praktik,
        foto: doctorForm.foto || null,
      };

      await api.put(`/doctors/${doctor.id}`, updateData);

      updateLoadingToast(
        toastId,
        "✅ Profil dokter berhasil diperbarui!",
        "success",
      );

      await fetchDoctorData();
    } catch (err) {
      console.error("Error saving doctor profile:", err);

      let errorMessage = "❌ Gagal memperbarui profil dokter";

      if (err.response?.status === 403) {
        errorMessage = "❌ Akses ditolak. Pastikan Anda login sebagai dokter.";
      } else if (err.response?.status === 404) {
        errorMessage = "❌ Data dokter tidak ditemukan. Silakan hubungi admin.";
      } else if (err.response?.data?.message) {
        errorMessage = `❌ ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }

      updateLoadingToast(toastId, errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("Password baru dan konfirmasi tidak cocok");
      showToast("❌ Password baru dan konfirmasi tidak cocok", "error");
      return;
    }
    if (passwordData.new_password.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      showToast("❌ Password minimal 6 karakter", "error");
      return;
    }

    const toastId = showLoadingToast("🔄 Mengubah password...");
    setChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      await api.post("/profiles/change-password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordSuccess("✅ Password berhasil diubah!");
      updateLoadingToast(toastId, "✅ Password berhasil diubah!", "success");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      let errorMsg = "❌ Gagal mengubah password";
      if (err.response?.data?.message) {
        errorMsg = `❌ ${err.response.data.message}`;
      }
      setPasswordError(errorMsg);
      updateLoadingToast(toastId, errorMsg, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      showToast("❌ Masukkan password untuk konfirmasi", "error");
      return;
    }
    if (
      !window.confirm(
        "⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan! Semua data Anda akan dihapus permanen. Lanjutkan?",
      )
    ) {
      return;
    }

    const toastId = showLoadingToast("🔄 Menghapus akun...");
    setDeleting(true);

    try {
      await api.post("/profiles/delete-account", { password: deletePassword });
      updateLoadingToast(
        toastId,
        "✅ Akun Anda telah dihapus. Terima kasih telah menggunakan T-Medic.",
        "success",
      );
      setTimeout(() => {
        logout();
        navigate("/register");
      }, 1500);
    } catch (err) {
      let errorMsg = "❌ Gagal menghapus akun";
      if (err.response?.data?.message) {
        errorMsg = `❌ ${err.response.data.message}`;
      }
      updateLoadingToast(toastId, errorMsg, "error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Cek role user
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "dokter";
  const isPatient = user?.role === "pasien";

  // Redirect atau blokir akses jika role tidak sesuai
  // Admin tidak boleh mengakses fitur dokter
  if (isAdmin && activeTab === "doctor") {
    setActiveTab("profile");
  }

  const getPageTitle = () => {
    if (isAdmin) return "🛡️ Pengaturan Admin";
    if (isDoctor) return "👨‍⚕️ Pengaturan Profil Dokter";
    return "⚙️ Pengaturan Akun Pasien";
  };

  const getPageSubtitle = () => {
    if (isAdmin) return "Kelola pengaturan akun administrator";
    if (isDoctor) return "Kelola informasi profil dokter Anda";
    return "Kelola informasi dan keamanan akun Anda";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12">
      <ToastContainer
        toasts={toasts}
        removeToast={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                isAdmin
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                  : isDoctor
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : "bg-gradient-to-r from-blue-500 to-cyan-600"
              }`}
            >
              {isAdmin ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : isDoctor ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-gray-500">{getPageSubtitle()}</p>
        </div>

        {/* Tabs - Admin hanya melihat tab yang sesuai */}
        <div className="flex gap-2 border-b border-gray-200 mb-6 flex-wrap overflow-x-auto pb-2">
          {/* Tab Profil - SEMUA ROLE bisa lihat */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition-all ${activeTab === "profile" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
          >
            👤 Profil Saya
          </button>

          {/* Tab Profil Dokter - HANYA UNTUK ROLE DOKTER, ADMIN TIDAK BISA LIHAT */}
          {isDoctor && (
            <button
              onClick={() => setActiveTab("doctor")}
              className={`px-5 py-2.5 font-medium rounded-t-xl transition-all ${activeTab === "doctor" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
            >
              🩺 Profil Dokter
            </button>
          )}

          {/* Tab Keamanan - SEMUA ROLE bisa lihat */}
          <button
            onClick={() => setActiveTab("security")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition-all ${activeTab === "security" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
          >
            🔒 Keamanan
          </button>

          {/* Tab Riwayat Aktivitas - SEMUA ROLE bisa lihat */}
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition-all ${activeTab === "activity" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
          >
            📜 Riwayat Aktivitas
          </button>

          {/* Tab Hapus Akun - SEMUA ROLE bisa lihat */}
          <button
            onClick={() => setActiveTab("danger")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition-all ${activeTab === "danger" ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md" : "text-rose-500 hover:text-rose-700 hover:bg-rose-50"}`}
          >
            ⚠️ Hapus Akun
          </button>
        </div>

        {/* Tab Profil - SEMUA ROLE */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-5 mb-6 pb-4 border-b border-gray-100">
              <div className="relative">
                {formData.foto_url ? (
                  <img
                    src={formData.foto_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-green-500 shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?background=0d9488&color=fff&name=${formData.nama || user?.nama || "U"}&length=2&bold=true`;
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {formData.nama?.charAt(0).toUpperCase() ||
                      user?.nama?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {formData.nama || user?.nama}
                  </h2>
                  {/* Badge role - tampilkan sesuai role */}
                  {isAdmin && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      Administrator
                    </span>
                  )}
                  {isDoctor && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Dokter
                    </span>
                  )}
                  {isPatient && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      Pasien
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  🗓️ Terdaftar sejak: {formatDate(profile?.created_at)}
                </p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleProfileChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  name="nomor_telepon"
                  value={formData.nomor_telepon}
                  onChange={handleProfileChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleProfileChange}
                  rows="2"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Foto Profil (URL)
                </label>
                <input
                  type="text"
                  name="foto_url"
                  value={formData.foto_url}
                  onChange={handleProfileChange}
                  placeholder="https://example.com/foto.jpg"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  name="email_notifikasi"
                  checked={formData.email_notifikasi}
                  onChange={handleProfileChange}
                  className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <label className="text-gray-700">
                  📧 Aktifkan notifikasi email
                </label>
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition font-semibold shadow-md hover:shadow-lg"
              >
                💾 Simpan Perubahan
              </button>
            </form>
          </div>
        )}

        {/* Tab Profil Dokter - HANYA untuk role DOKTER, ADMIN TIDAK BISA AKSES */}
        {isDoctor && activeTab === "doctor" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-5 mb-6 pb-4 border-b border-gray-100">
              <div className="relative">
                {doctorForm.foto ? (
                  <img
                    src={doctorForm.foto}
                    alt="Doctor"
                    className="w-24 h-24 rounded-full object-cover border-4 border-green-500 shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?background=0d9488&color=fff&name=${doctorForm.nama_dokter || "D"}&length=2&bold=true`;
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-5xl shadow-lg">
                    👨‍⚕️
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {doctorForm.nama_dokter || "Dokter"}
                </h2>
                <p className="text-green-600 font-medium">
                  {doctorForm.spesialis || "Belum diisi"}
                </p>
                {doctorData && (
                  <p className="text-xs text-gray-400 mt-1">
                    ID Dokter: {doctorData.id}
                  </p>
                )}
              </div>
            </div>
            <form onSubmit={saveDoctorProfile} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Nama Dokter
                </label>
                <input
                  type="text"
                  name="nama_dokter"
                  value={doctorForm.nama_dokter}
                  onChange={handleDoctorChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Spesialis
                </label>
                <input
                  type="text"
                  name="spesialis"
                  value={doctorForm.spesialis}
                  onChange={handleDoctorChange}
                  placeholder="Contoh: Dokter Umum, Spesialis Jantung"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Biaya Konsultasi (Rp)
                </label>
                <input
                  type="number"
                  name="biaya_konsultasi"
                  value={doctorForm.biaya_konsultasi}
                  onChange={handleDoctorChange}
                  placeholder="100000"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Jadwal Praktik
                </label>
                <input
                  type="text"
                  name="jadwal_praktik"
                  value={doctorForm.jadwal_praktik}
                  onChange={handleDoctorChange}
                  placeholder="Senin-Jumat, 09:00-17:00"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Foto Profil (URL)
                </label>
                <input
                  type="text"
                  name="foto"
                  value={doctorForm.foto}
                  onChange={handleDoctorChange}
                  placeholder="https://example.com/foto-dokter.jpg"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg
                      className="inline w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      stroke="currentColor"
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
                    Menyimpan...
                  </>
                ) : (
                  "💾 Simpan Profil Dokter"
                )}
              </button>
            </form>
            {!doctorData && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm text-center">
                ⚠️ Data dokter belum ditemukan. Pastikan Anda sudah terdaftar
                sebagai dokter.
              </div>
            )}
          </div>
        )}

        {/* Tab Keamanan - SEMUA ROLE */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Ubah Password</h2>
            </div>
            <form onSubmit={changePassword} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  ✅ Minimal 6 karakter
                </p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-xl text-sm">
                  {passwordSuccess}
                </div>
              )}
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition disabled:opacity-50 font-semibold shadow-md hover:shadow-lg"
              >
                {changingPassword ? "🔑 Memproses..." : "🔑 Ubah Password"}
              </button>
            </form>
          </div>
        )}

        {/* Tab Riwayat Aktivitas - SEMUA ROLE */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📜</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Riwayat Aktivitas
              </h2>
            </div>
            {activityLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-400">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-green-50 rounded-lg transition"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-gray-700 text-sm">{log.activity}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Hapus Akun - SEMUA ROLE */}
        {activeTab === "danger" && (
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-rose-600 mb-3">
                Hapus Akun
              </h2>
              <p className="text-gray-600 mb-5 max-w-md mx-auto">
                Tindakan ini tidak dapat dibatalkan. Semua data Anda akan
                dihapus permanen.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl transition font-semibold shadow-md hover:shadow-lg"
                >
                  🗑️ Hapus Akun Saya
                </button>
              ) : (
                <div className="bg-rose-50 p-5 rounded-xl max-w-md mx-auto">
                  <p className="text-rose-600 font-semibold mb-3">
                    Konfirmasi Hapus Akun
                  </p>
                  <input
                    type="password"
                    placeholder="Masukkan password Anda"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full border-2 border-rose-300 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-xl transition font-medium"
                    >
                      Batal
                    </button>
                    <button
                      onClick={deleteAccount}
                      disabled={deleting}
                      className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-2 rounded-xl transition disabled:opacity-50 font-medium"
                    >
                      {deleting ? "Memproses..." : "Ya, Hapus Akun"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Tambahkan CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  @keyframes loadingProgress { 0% { width: 100%; } 100% { width: 0%; } }
`;
if (!document.head.querySelector("#settings-animations")) {
  style.id = "settings-animations";
  document.head.appendChild(style);
}

export default Settings;
