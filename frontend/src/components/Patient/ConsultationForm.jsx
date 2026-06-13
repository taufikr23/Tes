import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../utils/api";

const ConsultationForm = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [keluhan, setKeluhan] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get("/doctors");
      setDoctors(response.data.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Silakan login terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/consultations", {
        user_id: user.id,
        doctor_id: selectedDoctor,
        keluhan: keluhan,
      });

      if (response.data.success) {
        alert("Konsultasi berhasil dikirim!");
        setKeluhan("");
        setSelectedDoctor("");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengirim konsultasi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading doctors...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Pilih Dokter
        </label>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        >
          <option value="">Pilih dokter...</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.nama_dokter} - {doctor.spesialis}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Keluhan Kesehatan
        </label>
        <textarea
          value={keluhan}
          onChange={(e) => setKeluhan(e.target.value)}
          rows="5"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Jelaskan keluhan Anda secara detail..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
      >
        {submitting ? "Mengirim..." : "Kirim Konsultasi"}
      </button>
    </form>
  );
};

export default ConsultationForm;
