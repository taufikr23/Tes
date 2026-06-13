import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

const DoctorsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleConsult = (doctorId) => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/consultation", { state: { doctorId } });
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.nama_dokter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.spesialis.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Daftar Dokter</h1>
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Cari dokter berdasarkan nama atau spesialis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
                    {doctor.foto ? (
                      <img
                        src={doctor.foto}
                        alt={doctor.nama_dokter}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-cyan-600"
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
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {doctor.nama_dokter}
                    </h3>
                    <p className="text-cyan-600">{doctor.spesialis}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-gray-600 text-sm">
                    <strong>Biaya Konsultasi:</strong> Rp{" "}
                    {doctor.biaya_konsultasi?.toLocaleString("id-ID")}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <strong>Jadwal Praktik:</strong> {doctor.jadwal_praktik}
                  </p>
                </div>

                <button
                  onClick={() => handleConsult(doctor.id)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Konsultasi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
