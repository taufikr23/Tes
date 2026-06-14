import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");

  // Form edit profil
  const [formData, setFormData] = useState({
    nama: "",
    nomor_telepon: "",
    alamat: "",
    foto_url: "",
    email_notifikasi: true,
  });

  // Form edit dokter (khusus role dokter)
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
    fetchDoctorData();
    fetchActivityLogs();
  }, []);

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
    if (user?.role !== "dokter") return;

    try {
      // Cari data dokter berdasarkan user_id
      const doctorsRes = await api.get("/doctors");
      const doctor = doctorsRes.data.data.find((d) => d.user_id === user.id);

      if (doctor) {
        setDoctorData(doctor);
        setDoctorForm({
          nama_dokter: doctor.nama_dokter || "",
          spesialis: doctor.spesialis || "",
          biaya_konsultasi: doctor.biaya_konsultasi || "",
          jadwal_praktik: doctor.jadwal_praktik || "",
          foto: doctor.foto || "",
        });
      }
    } catch (err) {
      console.error("Error fetching doctor data:", err);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await api.get("/profiles/activity-logs");
      setActivityLogs(res.data.data || []);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoading(false);
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
    setSaving(true);
    try {
      await api.put("/profiles/me", formData);
      alert("✅ Profil berhasil diperbarui!");
      fetchProfile();

      // Update user di localStorage
      const updatedUser = {
        ...user,
        nama: formData.nama,
        foto_url: formData.foto_url,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  // Di bagian saveDoctorProfile, ganti dengan ini:

  const saveDoctorProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (doctorData) {
        // Update ke tabel doctors (bukan profiles!)
        await api.put(`/doctors/${doctorData.id}`, {
          nama_dokter: doctorForm.nama_dokter,
          spesialis: doctorForm.spesialis,
          biaya_konsultasi: parseFloat(doctorForm.biaya_konsultasi),
          jadwal_praktik: doctorForm.jadwal_praktik,
          foto: doctorForm.foto, // Foto dokter disimpan di tabel doctors
        });
        alert("✅ Profil dokter berhasil diperbarui!");
        fetchDoctorData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui profil dokter");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("Password baru dan konfirmasi tidak cocok");
      return;
    }
    if (passwordData.new_password.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      return;
    }

    setChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      await api.post("/profiles/change-password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordSuccess("✅ Password berhasil diubah!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Gagal mengubah password",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      alert("Masukkan password untuk konfirmasi");
      return;
    }

    if (
      !window.confirm(
        "⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan! Semua data Anda akan dihapus permanen. Lanjutkan?",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await api.post("/profiles/delete-account", { password: deletePassword });
      alert("Akun Anda telah dihapus. Terima kasih telah menggunakan T-Medic.");
      logout();
      navigate("/register");
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus akun");
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

  const isDoctor = user?.role === "dokter";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">
            {isDoctor ? "👨‍⚕️ Pengaturan Profil Dokter" : "⚙️ Pengaturan Akun"}
          </h1>
          <p className="text-gray-500">
            {isDoctor
              ? "Kelola informasi profil dokter Anda"
              : "Kelola informasi dan keamanan akun Anda"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-emerald-200 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition ${
              activeTab === "profile"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            {isDoctor ? "👤 Profil Diri" : "👤 Profil Saya"}
          </button>
          {isDoctor && (
            <button
              onClick={() => setActiveTab("doctor")}
              className={`px-5 py-2.5 font-medium rounded-t-xl transition ${
                activeTab === "doctor"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-500 hover:text-emerald-600"
              }`}
            >
              🩺 Profil Dokter
            </button>
          )}
          <button
            onClick={() => setActiveTab("security")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition ${
              activeTab === "security"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            🔒 Keamanan
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition ${
              activeTab === "activity"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            📜 Riwayat Aktivitas
          </button>
          <button
            onClick={() => setActiveTab("danger")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition ${
              activeTab === "danger"
                ? "bg-rose-600 text-white shadow-md"
                : "text-rose-500 hover:text-rose-700"
            }`}
          >
            ⚠️ Hapus Akun
          </button>
        </div>

        {/* Tab Profil Diri */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {formData.foto_url ? (
                  <img
                    src={formData.foto_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  formData.nama?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {formData.nama || user?.nama}
                </h2>
                <p className="text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Terdaftar sejak: {formatDate(profile?.created_at)}
                </p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleProfileChange}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  name="nomor_telepon"
                  value={formData.nomor_telepon}
                  onChange={handleProfileChange}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleProfileChange}
                  rows="2"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Foto Profil (URL)
                </label>
                <input
                  type="text"
                  name="foto_url"
                  value={formData.foto_url}
                  onChange={handleProfileChange}
                  placeholder="https://example.com/foto.jpg"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="email_notifikasi"
                  checked={formData.email_notifikasi}
                  onChange={handleProfileChange}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <label className="text-gray-700">
                  Aktifkan notifikasi email
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition disabled:opacity-50 font-medium"
              >
                {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
              </button>
            </form>
          </div>
        )}

        {/* Tab Profil Dokter (khusus dokter) */}
        {isDoctor && activeTab === "doctor" && (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {doctorForm.foto ? (
                  <img
                    src={doctorForm.foto}
                    alt="Doctor"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  "👨‍⚕️"
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {doctorForm.nama_dokter || "Dokter"}
                </h2>
                <p className="text-emerald-600">
                  {doctorForm.spesialis || "Belum diisi"}
                </p>
              </div>
            </div>

            <form onSubmit={saveDoctorProfile} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nama Dokter
                </label>
                <input
                  type="text"
                  name="nama_dokter"
                  value={doctorForm.nama_dokter}
                  onChange={handleDoctorChange}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Spesialis
                </label>
                <input
                  type="text"
                  name="spesialis"
                  value={doctorForm.spesialis}
                  onChange={handleDoctorChange}
                  placeholder="Contoh: Dokter Umum, Spesialis Jantung"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Biaya Konsultasi (Rp)
                </label>
                <input
                  type="number"
                  name="biaya_konsultasi"
                  value={doctorForm.biaya_konsultasi}
                  onChange={handleDoctorChange}
                  placeholder="100000"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Jadwal Praktik
                </label>
                <input
                  type="text"
                  name="jadwal_praktik"
                  value={doctorForm.jadwal_praktik}
                  onChange={handleDoctorChange}
                  placeholder="Senin-Jumat, 09:00-17:00"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Foto Profil (URL)
                </label>
                <input
                  type="text"
                  name="foto"
                  value={doctorForm.foto}
                  onChange={handleDoctorChange}
                  placeholder="https://example.com/foto-dokter.jpg"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition disabled:opacity-50 font-medium"
              >
                {saving ? "Menyimpan..." : "💾 Simpan Profil Dokter"}
              </button>
            </form>
          </div>
        )}

        {/* Tab Keamanan */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              🔒 Ubah Password
            </h2>
            <form onSubmit={changePassword} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Minimal 6 karakter</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              {passwordError && (
                <p className="text-rose-500 text-sm">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-emerald-500 text-sm">{passwordSuccess}</p>
              )}
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition disabled:opacity-50 font-medium"
              >
                {changingPassword ? "Memproses..." : "🔑 Ubah Password"}
              </button>
            </form>
          </div>
        )}

        {/* Tab Riwayat Aktivitas */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              📜 Riwayat Aktivitas
            </h2>
            {activityLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Belum ada aktivitas
              </p>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-gray-700">{log.activity}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Hapus Akun */}
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
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl transition font-medium"
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
                    className="w-full border border-rose-300 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={deleteAccount}
                      disabled={deleting}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl transition disabled:opacity-50"
                    >
                      {deleting ? "Memproses..." : "Ya, Hapus Akun Saya"}
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
};;

export default Settings;
