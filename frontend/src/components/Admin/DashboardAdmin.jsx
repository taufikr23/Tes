import React, { useState, useEffect } from "react";
import api from "../utils/api";
import DoctorForm from "../components/Admin/DoctorForm";
import MedicineForm from "../components/Admin/MedicineForm";
import AdminApplications from "./AdminApplications";

const DashboardAdmin = () => {
  const [activeTab, setActiveTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "doctors") {
      fetchDoctors();
      fetchUsers();
    }
    if (activeTab === "medicines") fetchMedicines();
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

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

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Ubah role user ini menjadi ${newRole}?`)) return;

    try {
      await api.put(`/profiles/${userId}/role`, { role: newRole });
      alert(`✅ Role berhasil diubah menjadi ${newRole}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Gagal mengubah role");
    }
  };

  const deleteDoctor = async (id) => {
    if (confirm("Yakin hapus dokter ini?")) {
      await api.delete(`/doctors/${id}`);
      fetchDoctors();
    }
  };

  const deleteMedicine = async (id) => {
    if (confirm("Yakin hapus obat ini?")) {
      await api.delete(`/medicines/${id}`);
      fetchMedicines();
    }
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
            Kelola Dokter
          </button>
          <button
            onClick={() => setActiveTab("medicines")}
            className={`px-4 py-2 font-medium ${activeTab === "medicines" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            Kelola Obat
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium ${activeTab === "users" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            Kelola User / Pasien
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 font-medium ${activeTab === "applications" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500"}`}
          >
            Pengajuan Dokter
          </button>
        </div>

        {/* Content Doctors */}
        {activeTab === "doctors" && (
          <div className="bg-white rounded-lg shadow p-6">
            <DoctorForm onSuccess={fetchDoctors} />
            <h3 className="text-xl font-semibold mt-8 mb-4">Daftar Dokter</h3>
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
                          Rp {doctor.biaya_konsultasi?.toLocaleString()}
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

        {/* Content Medicines */}
        {activeTab === "medicines" && (
          <div className="bg-white rounded-lg shadow p-6">
            <MedicineForm onSuccess={fetchMedicines} />
            <h3 className="text-xl font-semibold mt-8 mb-4">Daftar Obat</h3>
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
                          Rp {medicine.harga?.toLocaleString()}
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

        {/* Content Users */}
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
                          className={`px-2 py-1 rounded text-xs ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : user.role === "dokter"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
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

        {/* Content Applications - Pengajuan Dokter */}a
        {activeTab === "applications" && <AdminApplications />}
      </div>
    </div>
  );
};

export default DashboardAdmin;
