import React, { useState, useEffect } from "react";
import api from "../utils/api";
import AdminPayments from "./AdminPayments";

const DashboardAdmin = () => {
  const [activeTab, setActiveTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);

  // Pagination untuk pengajuan dokter
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Form tambah obat
  const [medicineForm, setMedicineForm] = useState({
    nama_obat: "",
    kategori: "",
    harga: "",
    stok: "",
    deskripsi: "",
  });

  useEffect(() => {
    if (activeTab === "doctors") {
      fetchDoctors();
      fetchUsers();
    }
    if (activeTab === "medicines") fetchMedicines();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "applications") {
      fetchApplications();
      setCurrentPage(1);
    }
  }, [activeTab]);

  // Hitung pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = applications.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(applications.length / itemsPerPage);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/doctors");
      setDoctors(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get("/medicines");
      setMedicines(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/profiles");
      setUsers(res.data.data);
    } catch (err) {
      console.error("Gagal ambil data user:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get("/doctor-applications");
      setApplications(res.data.data);
    } catch (err) {
      console.error("Gagal ambil pengajuan:", err);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Ubah role user ini menjadi ${newRole}?`)) return;

    try {
      const userToUpdate = users.find((u) => u.id === userId);
      await api.put(`/profiles/${userId}/role`, { role: newRole });

      if (newRole === "dokter") {
        const { data: existingDoctors } = await api.get("/doctors");
        const alreadyDoctor = existingDoctors.data.some(
          (d) => d.user_id === userId,
        );

        if (!alreadyDoctor) {
          await api.post("/doctors", {
            user_id: userId,
            nama_dokter: userToUpdate?.nama || "Dokter Baru",
            spesialis: "Dokter Umum",
            biaya_konsultasi: 50000,
            jadwal_praktik: "Senin - Jumat, 09:00 - 17:00",
            foto: "",
          });
        }
      }

      if (newRole !== "dokter") {
        const { data: doctors } = await api.get("/doctors");
        const doctorToDelete = doctors.data.find((d) => d.user_id === userId);
        if (doctorToDelete) {
          await api.delete(`/doctors/${doctorToDelete.id}`);
        }
      }

      alert(`✅ Role berhasil diubah menjadi ${newRole}`);
      fetchUsers();
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Gagal mengubah role");
    }
  };

  const deleteDoctor = async (id) => {
    if (
      !confirm(
        "Yakin hapus dokter ini? User akan otomatis berubah menjadi pasien.",
      )
    )
      return;

    try {
      const doctorToDelete = doctors.find((d) => d.id === id);
      if (doctorToDelete && doctorToDelete.user_id) {
        await api.put(`/profiles/${doctorToDelete.user_id}/role`, {
          role: "pasien",
        });
      }
      await api.delete(`/doctors/${id}`);
      alert("✅ Dokter dihapus dan role user diubah menjadi pasien");
      fetchDoctors();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus dokter");
    }
  };

  const deleteMedicine = async (id) => {
    if (confirm("Yakin hapus obat ini?")) {
      await api.delete(`/medicines/${id}`);
      fetchMedicines();
    }
  };

  const handleMedicineChange = (e) => {
    setMedicineForm({ ...medicineForm, [e.target.name]: e.target.value });
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/medicines", {
        ...medicineForm,
        harga: parseFloat(medicineForm.harga),
        stok: parseInt(medicineForm.stok),
      });
      alert("Obat berhasil ditambahkan");
      setMedicineForm({
        nama_obat: "",
        kategori: "",
        harga: "",
        stok: "",
        deskripsi: "",
      });
      fetchMedicines();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menambahkan obat");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm("Setujui pengajuan ini? User akan menjadi dokter.")) return;
    setProcessing(id);
    try {
      const response = await api.put(`/doctor-applications/${id}/approve`);
      alert("✅ Pengajuan disetujui! User sekarang menjadi dokter.");
      fetchApplications();
      fetchDoctors();
      fetchUsers();

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (response.data?.user_id === currentUser.id) {
        alert("Role Anda telah berubah menjadi DOKTER. Silakan login kembali.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyetujui");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    const pesan = prompt("Masukkan alasan penolakan:");
    if (pesan === null) return;
    setProcessing(id);
    try {
      await api.put(`/doctor-applications/${id}/reject`, {
        pesan_penolakan: pesan,
      });
      alert("❌ Pengajuan ditolak.");
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menolak");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "⏳ Menunggu",
      approved: "✅ Disetujui",
      rejected: "❌ Ditolak",
    };
    return texts[status] || status;
  };

  const formatRupiah = (value) => {
    if (!value && value !== 0) return "0";
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("doctors")}
            className={`px-4 py-2 font-medium ${activeTab === "doctors" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            📋 Daftar Dokter
          </button>
          <button
            onClick={() => setActiveTab("medicines")}
            className={`px-4 py-2 font-medium ${activeTab === "medicines" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            💊 Kelola Obat
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium ${activeTab === "users" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            👥 Kelola User
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 font-medium ${activeTab === "applications" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            📝 Pengajuan Dokter
            {applications.filter((a) => a.status === "pending").length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {applications.filter((a) => a.status === "pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 font-medium ${activeTab === "payments" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            💰 Pembayaran
          </button>
        </div>

        {/* TABEL DOKTER */}
        {activeTab === "doctors" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Daftar Dokter</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Nama</th>
                      <th className="px-4 py-2 text-left">Spesialis</th>
                      <th className="px-4 py-2 text-left">Biaya</th>
                      <th className="px-4 py-2 text-left">Jadwal</th>
                      <th className="px-4 py-2 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="border-b">
                        <td className="px-4 py-2">{doctor.nama_dokter}</td>
                        <td className="px-4 py-2">{doctor.spesialis}</td>
                        <td className="px-4 py-2">
                          Rp {formatRupiah(doctor.biaya_konsultasi)}
                        </td>
                        <td className="px-4 py-2">{doctor.jadwal_praktik}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => deleteDoctor(doctor.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* KELOLA OBAT */}
        {activeTab === "medicines" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Tambah Obat Baru</h3>
            <form
              onSubmit={handleAddMedicine}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <input
                name="nama_obat"
                placeholder="Nama Obat"
                value={medicineForm.nama_obat}
                onChange={handleMedicineChange}
                className="border p-2 rounded"
                required
              />
              <select
                name="kategori"
                value={medicineForm.kategori}
                onChange={handleMedicineChange}
                className="border p-2 rounded"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                <option value="Analgesik">💊 Analgesik</option>
                <option value="Antipiretik">🌡️ Antipiretik</option>
                <option value="Antibiotik">🦠 Antibiotik</option>
                <option value="Antihistamin">🤧 Antihistamin</option>
                <option value="Antimabuk">🚗 Antimabuk</option>
                <option value="Antasida">🍽️ Antasida</option>
                <option value="Antibatik">😷 Antibatik</option>
                <option value="Antiflu">🤒 Antiflu</option>
                <option value="Antidepresan">😔 Antidepresan</option>
                <option value="Antijamur">🍄 Antijamur</option>
                <option value="Antivirus">🦠 Antivirus</option>
                <option value="Vitamin">🍊 Vitamin</option>
                <option value="Kortikosteroid">💉 Kortikosteroid</option>
                <option value="Diuretik">💧 Diuretik</option>
                <option value="Antihipertensi">❤️ Antihipertensi</option>
                <option value="Antidiabetes">🩸 Antidiabetes</option>
                <option value="Kolesterol">🫀 Kolesterol</option>
                <option value="Salep">🧴 Salep</option>
                <option value="Herbal">🌿 Herbal</option>
                <option value="Lainnya">📦 Lainnya</option>
              </select>
              <input
                name="harga"
                type="number"
                placeholder="Harga"
                value={medicineForm.harga}
                onChange={handleMedicineChange}
                className="border p-2 rounded"
                required
              />
              <input
                name="stok"
                type="number"
                placeholder="Stok"
                value={medicineForm.stok}
                onChange={handleMedicineChange}
                className="border p-2 rounded"
                required
              />
              <textarea
                name="deskripsi"
                placeholder="Deskripsi"
                value={medicineForm.deskripsi}
                onChange={handleMedicineChange}
                className="border p-2 rounded col-span-2"
                rows="2"
              />
              <button
                type="submit"
                className="bg-cyan-600 text-white px-4 py-2 rounded col-span-2"
              >
                Simpan Obat
              </button>
            </form>

            <h3 className="text-xl font-semibold mb-4">Daftar Obat</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Nama Obat</th>
                      <th className="px-4 py-2 text-left">Kategori</th>
                      <th className="px-4 py-2 text-left">Harga</th>
                      <th className="px-4 py-2 text-left">Stok</th>
                      <th className="px-4 py-2 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((medicine) => (
                      <tr key={medicine.id} className="border-b">
                        <td className="px-4 py-2">{medicine.nama_obat}</td>
                        <td className="px-4 py-2">{medicine.kategori}</td>
                        <td className="px-4 py-2">
                          Rp {formatRupiah(medicine.harga)}
                        </td>
                        <td className="px-4 py-2">{medicine.stok}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => deleteMedicine(medicine.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* KELOLA USER */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Daftar User / Pasien</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Nama</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">No Telepon</th>
                    <th className="px-4 py-2 text-left">Ubah Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="px-4 py-2 text-xs">
                        {user.id?.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-2">{user.nama}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${user.role === "admin" ? "bg-red-100 text-red-800" : user.role === "dokter" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">{user.nomor_telepon || "-"}</td>
                      <td className="px-4 py-2">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateUserRole(user.id, e.target.value)
                          }
                          className="border rounded px-2 py-1 text-sm cursor-pointer"
                        >
                          <option value="pasien">Pasien</option>
                          <option value="dokter">Dokter</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PENGAJUAN DOKTER */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                📋 Pengajuan Menjadi Dokter
              </h3>
              <div className="text-sm text-gray-500">
                Total: {applications.length} pengajuan
              </div>
            </div>
            {applications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Belum ada pengajuan dokter
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentApplications.map((app) => (
                    <div
                      key={app.id}
                      className={`border rounded-xl p-5 transition-all hover:shadow-lg ${app.status === "pending" ? "border-yellow-300 bg-yellow-50/30" : app.status === "approved" ? "border-green-300 bg-green-50/30" : "border-red-300 bg-red-50/30"}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">
                            {app.nama_dokter}
                          </h4>
                          <p className="text-cyan-600 text-sm font-medium">
                            {app.spesialis}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${app.status === "pending" ? "bg-yellow-100 text-yellow-700" : app.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {app.status === "pending"
                            ? "⏳ Menunggu"
                            : app.status === "approved"
                              ? "✅ Disetujui"
                              : "❌ Ditolak"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">
                            💰 Biaya Konsultasi
                          </p>
                          <p className="font-semibold">
                            Rp {formatRupiah(app.biaya_konsultasi)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">
                            📅 Jadwal Praktik
                          </p>
                          <p className="font-semibold text-sm">
                            {app.jadwal_praktik}
                          </p>
                        </div>
                      </div>
                      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-400 text-xs">👤 Pengaju</p>
                        <p className="font-medium text-sm">
                          {app.profiles?.nama} ({app.profiles?.email})
                        </p>
                      </div>
                      <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-400 text-xs">
                          📆 Waktu Pengajuan
                        </p>
                        <p className="font-medium text-sm">
                          {formatDate(app.created_at)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ⏰ {formatTime(app.created_at)}
                        </p>
                      </div>
                      {app.status === "rejected" && app.pesan_penolakan && (
                        <div className="mb-4 p-2 bg-red-50 rounded-lg">
                          <p className="text-red-500 text-xs">
                            ❌ Alasan Penolakan
                          </p>
                          <p className="text-red-600 text-sm">
                            {app.pesan_penolakan}
                          </p>
                        </div>
                      )}
                      {app.status === "pending" && (
                        <div className="flex gap-3 mt-3 pt-3 border-t">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={processing === app.id}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            {processing === app.id
                              ? "Memproses..."
                              : "✅ Setujui"}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={processing === app.id}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            {processing === app.id
                              ? "Memproses..."
                              : "❌ Tolak"}
                          </button>
                        </div>
                      )}
                      {app.status === "approved" && (
                        <div className="mt-3 p-2 bg-green-50 rounded-lg text-center">
                          <p className="text-green-600 text-xs">
                            ✅ Pengajuan telah disetujui
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                      ← Sebelumnya
                    </button>
                    <span className="text-sm text-gray-600">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PEMBAYARAN */}
        {activeTab === "payments" && <AdminPayments />}
      </div>
    </div>
  );
};

export default DashboardAdmin;
