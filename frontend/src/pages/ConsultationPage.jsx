import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

const ConsultationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(
    location.state?.doctorId || "",
  );
  const [keluhan, setKeluhan] = useState("");
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
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
        alert("Konsultasi berhasil dikirim! Dokter akan segera merespon.");
        navigate("/consultations/history");
      }
    } catch (error) {
      alert("Gagal mengirim konsultasi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            Konsultasi Kesehatan
          </h1>
          <p className="text-cyan-100 mt-1">
            Dapatkan diagnosis dari dokter profesional
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Pilih Dokter
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            >
              <option value="">-- Pilih Dokter --</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.nama_dokter} - {doctor.spesialis} (Rp{" "}
                  {doctor.biaya_konsultasi?.toLocaleString("id-ID")})
                </option>
              ))}
            </select>
          </div>

          {selectedDoctorData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-cyan-600"
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
                </div>
                <div className="ml-4">
                  <p className="font-semibold">
                    {selectedDoctorData.nama_dokter}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedDoctorData.spesialis}
                  </p>
                  <p className="text-sm text-gray-500">
                    Jadwal: {selectedDoctorData.jadwal_praktik}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Keluhan Kesehatan
            </label>
            <textarea
              value={keluhan}
              onChange={(e) => setKeluhan(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Jelaskan keluhan Anda secara detail. Contoh: Saya mengalami demam selama 3 hari, batuk, dan pilek..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Semakin detail keluhan Anda, semakin akurat diagnosis yang akan
              diberikan.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Mengirim..." : "Kirim Konsultasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationPage;
