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
  const [showPayment, setShowPayment] = useState(false);
  const [consultationData, setConsultationData] = useState(null);
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [selectedDoctorData, setSelectedDoctorData] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor);
      setSelectedDoctorData(doctor);
    }
  }, [selectedDoctor, doctors]);

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

    if (!selectedDoctor) {
      alert("Pilih dokter terlebih dahulu");
      return;
    }

    if (!keluhan.trim()) {
      alert("Masukkan keluhan Anda");
      return;
    }

    setSubmitting(true);
    try {
      // Buat konsultasi dulu dengan status pending_payment
      const response = await api.post("/consultations", {
        user_id: user.id,
        doctor_id: selectedDoctor,
        keluhan: keluhan,
        status_konsultasi: "pending_payment",
      });

      if (response.data.success) {
        setConsultationData(response.data.data);
        setShowPayment(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Gagal membuat konsultasi");
    } finally {
      setSubmitting(false);
    }
  };

const handlePayment = async (e) => {
  e.preventDefault();

  if (!paymentProof) {
    alert("Silakan upload bukti pembayaran");
    return;
  }

  setPaymentSubmitting(true);
  try {
    // Simpan pembayaran konsultasi
    const response = await api.post("/consultation-payments", {
      consultation_id: consultationData.id,
      user_id: user.id,
      doctor_id: selectedDoctor,
      amount: selectedDoctorData?.biaya_konsultasi,
      payment_method: paymentMethod,
      payment_proof: paymentProof,
    });

    console.log("Payment response:", response.data);

    if (response.data.success) {
      alert(
        "✅ Bukti pembayaran berhasil dikirim! Silakan tunggu konfirmasi dari admin.",
      );
      navigate("/consultations/history");
    } else {
      alert(response.data.message || "Gagal mengirim pembayaran");
    }
  } catch (error) {
    console.error("Payment error:", error);
    alert(error.response?.data?.message || "Gagal mengirim pembayaran");
  } finally {
    setPaymentSubmitting(false);
  }
};

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  // Halaman pembayaran
  if (showPayment && selectedDoctorData && consultationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
              <h1 className="text-xl font-bold text-white">
                💳 Pembayaran Konsultasi
              </h1>
              <p className="text-emerald-100 text-sm">
                Silakan lakukan pembayaran sebelum konsultasi
              </p>
            </div>

            <div className="p-6">
              {/* Ringkasan Konsultasi */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  📋 Ringkasan Konsultasi
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dokter:</span>
                    <span className="font-medium">
                      {selectedDoctorData.nama_dokter}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Spesialis:</span>
                    <span>{selectedDoctorData.spesialis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biaya Konsultasi:</span>
                    <span className="font-bold text-emerald-600">
                      Rp {formatRupiah(selectedDoctorData.biaya_konsultasi)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Keluhan:</span>
                    <span className="truncate max-w-[200px]">
                      {keluhan.substring(0, 50)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Pembayaran */}
              <form onSubmit={handlePayment} className="space-y-5">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="bank_transfer">
                      🏦 Transfer Bank (BCA/Mandiri/BNI)
                    </option>
                    <option value="qris">📱 QRIS</option>
                    <option value="virtual_account">🏧 Virtual Account</option>
                  </select>
                </div>

                {/* Instruksi Transfer */}
                {paymentMethod === "bank_transfer" && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      📋 Instruksi Transfer Bank
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Bank:</span> BCA
                      </p>
                      <p>
                        <span className="font-medium">Nomor Rekening:</span>{" "}
                        123-456-7890
                      </p>
                      <p>
                        <span className="font-medium">Atas Nama:</span> PT
                        T-Medic Sehat
                      </p>
                      <p>
                        <span className="font-medium">Jumlah Transfer:</span>{" "}
                        <span className="font-bold text-green-600">
                          Rp {formatRupiah(selectedDoctorData.biaya_konsultasi)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "qris" && (
                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <h4 className="font-semibold text-green-800 mb-2">
                      📱 Scan QRIS
                    </h4>
                    <div className="w-32 h-32 bg-white rounded-xl mx-auto flex items-center justify-center mb-2">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-3xl">📱</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Scan QR Code
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Total: Rp{" "}
                      {formatRupiah(selectedDoctorData.biaya_konsultasi)}
                    </p>
                  </div>
                )}

                {paymentMethod === "virtual_account" && (
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-800 mb-2">
                      🏧 Virtual Account
                    </h4>
                    <p className="text-sm">
                      VA Number:{" "}
                      <span className="font-mono font-bold">
                        88608{consultationData?.id?.slice(0, 6)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Total: Rp{" "}
                      {formatRupiah(selectedDoctorData.biaya_konsultasi)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    📎 Bukti Pembayaran (URL Foto)
                  </label>
                  <input
                    type="text"
                    value={paymentProof}
                    onChange={(e) => setPaymentProof(e.target.value)}
                    placeholder="https://example.com/bukti-pembayaran.jpg"
                    className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Upload foto bukti transfer ke hosting dan masukkan URL-nya
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {paymentSubmitting
                    ? "Memproses..."
                    : "✅ Konfirmasi Pembayaran"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form konsultasi
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            Konsultasi Kesehatan
          </h1>
          <p className="text-emerald-100 mt-1">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">-- Pilih Dokter --</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.nama_dokter} - {doctor.spesialis} (Rp{" "}
                  {formatRupiah(doctor.biaya_konsultasi)})
                </option>
              ))}
            </select>
          </div>

          {selectedDoctorData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={
                    selectedDoctorData.foto_url ||
                    `https://ui-avatars.com/api/?background=0891b2&color=fff&name=${selectedDoctorData.nama_dokter?.charAt(0) || "D"}`
                  }
                  className="w-16 h-16 rounded-full object-cover"
                  alt={selectedDoctorData.nama_dokter}
                />
                <div>
                  <p className="font-semibold text-lg">
                    {selectedDoctorData.nama_dokter}
                  </p>
                  <p className="text-emerald-600">
                    {selectedDoctorData.spesialis}
                  </p>
                  <p className="text-sm text-gray-500">
                    💰 Biaya: Rp{" "}
                    {formatRupiah(selectedDoctorData.biaya_konsultasi)}
                  </p>
                  <p className="text-sm text-gray-500">
                    📅 Jadwal: {selectedDoctorData.jadwal_praktik}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Jelaskan keluhan Anda secara detail..."
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Lanjutkan ke Pembayaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationPage;
