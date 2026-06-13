import React, { useState } from "react";
import api from "../../utils/api";
import PrescriptionForm from "./PrescriptionForm";

const DiagnosisForm = ({ consultation, onSuccess, onCancel }) => {
  const [hasilDiagnosa, setHasilDiagnosa] = useState("");
  const [showPrescription, setShowPrescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/consultations/${consultation.id}`, {
        hasil_diagnosa: hasilDiagnosa,
        status_konsultasi: "completed",
      });
      setShowPrescription(true);
    } catch (error) {
      alert("Gagal menyimpan diagnosis");
    } finally {
      setSubmitting(false);
    }
  };

  if (showPrescription) {
    return (
      <PrescriptionForm
        consultationId={consultation.id}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Keluhan Pasien
        </label>
        <div className="bg-gray-50 rounded-lg p-3 text-gray-600">
          {consultation.keluhan}
        </div>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Hasil Diagnosis
        </label>
        <textarea
          value={hasilDiagnosa}
          onChange={(e) => setHasilDiagnosa(e.target.value)}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Tuliskan diagnosis Anda..."
          required
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan & Lanjut ke Resep"}
        </button>
      </div>
    </form>
  );
};

export default DiagnosisForm;
