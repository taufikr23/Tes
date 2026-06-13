import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const PrescriptionForm = ({ consultationId, onSuccess, onCancel }) => {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [dosis, setDosis] = useState("");
  const [aturanPakai, setAturanPakai] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/medicines");
      setMedicines(response.data.data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Simpan resep ke database
      const prescriptionRes = await api.post("/consultations/prescription", {
        consultation_id: consultationId,
        medicine_id: selectedMedicine,
        dosis: dosis,
        aturan_pakai: aturanPakai,
      });

      if (prescriptionRes.data.success) {
        // 2. Dapatkan data konsultasi
        const consultationRes = await api.get(
          `/consultations/${consultationId}`,
        );
        const consultation = consultationRes.data.data;

        // 3. Dapatkan data obat
        const selectedMed = medicines.find((m) => m.id === selectedMedicine);

        // 4. Kirim resep sebagai pesan chat dengan format khusus
        await api.post("/chat/prescription", {
          consultation_id: consultationId,
          sender_id: consultation.doctor_id,
          receiver_id: consultation.user_id,
          prescription_data: {
            medicine_id: selectedMedicine,
            nama_obat: selectedMed?.nama_obat,
            dosis: dosis,
            aturan_pakai: aturanPakai,
            harga: selectedMed?.harga,
          },
        });

        alert("✅ Resep berhasil dikirim ke pasien via chat!");
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal mengirim resep");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Pilih Obat
        </label>
        <select
          value={selectedMedicine}
          onChange={(e) => setSelectedMedicine(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        >
          <option value="">Pilih obat...</option>
          {medicines.map((medicine) => (
            <option key={medicine.id} value={medicine.id}>
              {medicine.nama_obat} - Rp {medicine.harga?.toLocaleString()}{" "}
              (Stok: {medicine.stok})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Dosis</label>
        <input
          type="text"
          value={dosis}
          onChange={(e) => setDosis(e.target.value)}
          placeholder="Contoh: 1x sehari, 1 tablet"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Aturan Pakai
        </label>
        <textarea
          value={aturanPakai}
          onChange={(e) => setAturanPakai(e.target.value)}
          rows="3"
          placeholder="Contoh: Diminum setelah makan, pagi hari"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Kirim Resep ke Pasien"}
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
