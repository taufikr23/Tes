import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ChatRoom = ({
  consultationId,
  doctorId,
  doctorName,
  patientName,
  doctorPhoto,
  patientPhoto,
  onClose,
  onDiagnosisSent,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [submittingDiagnosis, setSubmittingDiagnosis] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [dosis, setDosis] = useState("");
  const [aturanPakai, setAturanPakai] = useState("");
  const [myProfile, setMyProfile] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const messagesEndRef = useRef(null);

  const consultationIdValue = consultationId?.id || consultationId;

  let receiverId = null;
  if (user?.role === "pasien") {
    receiverId = consultationId?.doctor_id;
  } else if (user?.role === "dokter") {
    receiverId = consultationId?.user_id;
  }

  // Ambil foto profil
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Ambil profil user sendiri
      const myProfileRes = await api.get("/profiles/me");
      setMyProfile(myProfileRes.data.data);
      console.log("My profile:", myProfileRes.data.data);

      // Ambil profil lawan bicara
      if (receiverId) {
        const { data: allProfiles } = await api.get("/profiles");
        const other = allProfiles.data.find((p) => p.id === receiverId);
        setOtherProfile(other);
        console.log("Other profile:", other);
      }
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  useEffect(() => {
    if (!consultationIdValue) {
      setError("ID konsultasi tidak valid");
      setLoading(false);
      return;
    }
    fetchMessages();
    fetchMedicines();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [consultationIdValue]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/${consultationIdValue}`);
      setMessages(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Gagal memuat pesan");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await api.get("/medicines");
      setMedicines(res.data.data || []);
    } catch (err) {
      console.error("Error fetching medicines:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!receiverId) {
      alert("Tidak dapat mengirim pesan: penerima tidak diketahui");
      return;
    }

    setSending(true);
    try {
      await api.post("/chat", {
        consultation_id: consultationIdValue,
        sender_id: user.id,
        receiver_id: receiverId,
        message: newMessage,
      });
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err.response?.data?.message || "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const sendDiagnosisAndPrescription = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert("Mohon isi diagnosis terlebih dahulu");
      return;
    }
    if (!selectedMedicine) {
      alert("Mohon pilih obat");
      return;
    }

    setSubmittingDiagnosis(true);
    try {
      await api.put(`/consultations/${consultationIdValue}`, {
        hasil_diagnosa: diagnosis,
        status_konsultasi: "completed",
      });

      const selectedMed = medicines.find((m) => m.id === selectedMedicine);

      const prescriptionMessage = {
        type: "prescription",
        data: {
          obat_id: selectedMedicine,
          nama_obat: selectedMed?.nama_obat,
          dosis: dosis,
          aturan_pakai: aturanPakai,
          harga: selectedMed?.harga,
          consultation_id: consultationIdValue,
        },
      };

      await api.post("/chat", {
        consultation_id: consultationIdValue,
        sender_id: user.id,
        receiver_id: receiverId,
        message: JSON.stringify(prescriptionMessage),
      });

      const diagnosisMessage = `🩺 *DIAGNOSIS DOKTER*\n\n${diagnosis}\n\n✨ *Semoga lekas sembuh!* ✨\n\nSilakan lihat resep obat di atas dan beli melalui aplikasi.`;

      await api.post("/chat", {
        consultation_id: consultationIdValue,
        sender_id: user.id,
        receiver_id: receiverId,
        message: diagnosisMessage,
      });

      await api.post("/consultations/prescription", {
        consultation_id: consultationIdValue,
        medicine_id: selectedMedicine,
        dosis: dosis,
        aturan_pakai: aturanPakai,
      });

      alert("✅ Diagnosis dan resep berhasil dikirim!");
      setShowDiagnosisForm(false);
      setDiagnosis("");
      setSelectedMedicine("");
      setDosis("");
      setAturanPakai("");
      fetchMessages();

      if (onDiagnosisSent) onDiagnosisSent();
    } catch (err) {
      console.error("Error sending diagnosis:", err);
      alert("Gagal mengirim diagnosis");
    } finally {
      setSubmittingDiagnosis(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const addToCart = (medicine) => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = existingCart.find(
      (item) => item.medicine_id === medicine.obat_id,
    );

    if (existingItem) {
      existingItem.jumlah += 1;
      existingItem.subtotal = existingItem.harga * existingItem.jumlah;
    } else {
      existingCart.push({
        medicine_id: medicine.obat_id,
        nama_obat: medicine.nama_obat,
        harga: medicine.harga,
        jumlah: 1,
        subtotal: medicine.harga,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    alert(`✅ ${medicine.nama_obat} ditambahkan ke keranjang!`);

    if (window.confirm("Lihat keranjang sekarang?")) {
      navigate("/cart");
      onClose();
    }
  };

  const getAvatarUrl = (name, background = "0891b2") => {
    return `https://ui-avatars.com/api/?background=${background}&color=fff&name=${encodeURIComponent(name || "U")}`;
  };

  const renderMessage = (msg) => {
    const isMyMessage = msg.sender_id === user.id;
    const senderProfile = isMyMessage ? myProfile : otherProfile;
    const senderName = isMyMessage
      ? user?.nama
      : user?.role === "pasien"
        ? doctorName
        : patientName;

    // Cek resep
    let isPrescription = false;
    let prescriptionData = null;
    try {
      const parsed = JSON.parse(msg.message);
      if (parsed.type === "prescription") {
        isPrescription = true;
        prescriptionData = parsed.data;
      }
    } catch (e) {}

    // RESEP OBAT
    if (isPrescription) {
      if (user?.role === "pasien") {
        return (
          <div
            className={`flex ${isMyMessage ? "justify-end" : "justify-start"} gap-2 mb-3`}
          >
            {!isMyMessage && (
              <img
                src={
                  otherProfile?.foto_url ||
                  getAvatarUrl(doctorName || "D", "7c3aed")
                }
                className="w-8 h-8 rounded-full object-cover mt-1"
                alt="Doctor"
              />
            )}
            <div className="max-w-[80%] bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📋</span>
                <span className="font-bold text-amber-700">
                  RESEP DARI DOKTER
                </span>
              </div>
              <div className="mb-2">
                <p className="font-semibold text-lg">
                  💊 {prescriptionData.nama_obat}
                </p>
                <p className="text-sm mt-1">
                  📌 Dosis: {prescriptionData.dosis}
                </p>
                <p className="text-sm">
                  📝 Aturan: {prescriptionData.aturan_pakai}
                </p>
                <p className="text-sm font-semibold mt-2 text-green-600">
                  💰 Harga: Rp {prescriptionData.harga?.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => addToCart(prescriptionData)}
                className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                🛒 Tambahkan ke Keranjang
              </button>
              <p className="text-xs text-gray-400 mt-2">
                {formatTime(msg.created_at)}
              </p>
            </div>
            {isMyMessage && (
              <img
                src={
                  myProfile?.foto_url ||
                  getAvatarUrl(user?.nama || "U", "0d9488")
                }
                className="w-8 h-8 rounded-full object-cover mt-1"
                alt="Me"
              />
            )}
          </div>
        );
      } else {
        return (
          <div
            className={`flex ${isMyMessage ? "justify-end" : "justify-start"} gap-2 mb-3`}
          >
            {!isMyMessage && (
              <img
                src={
                  otherProfile?.foto_url ||
                  getAvatarUrl(patientName || "P", "0891b2")
                }
                className="w-8 h-8 rounded-full object-cover mt-1"
                alt="Patient"
              />
            )}
            <div className="max-w-[80%] bg-blue-50 border-2 border-blue-300 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📋</span>
                <span className="font-bold text-blue-700">
                  RESEP YANG DIKIRIM
                </span>
              </div>
              <div className="mb-2">
                <p className="font-semibold text-lg">
                  💊 {prescriptionData.nama_obat}
                </p>
                <p className="text-sm mt-1">
                  📌 Dosis: {prescriptionData.dosis}
                </p>
                <p className="text-sm">
                  📝 Aturan: {prescriptionData.aturan_pakai}
                </p>
                <p className="text-sm font-semibold mt-2">
                  💰 Harga: Rp {prescriptionData.harga?.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-1 italic">
                *Resep telah dikirim ke pasien
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatTime(msg.created_at)}
              </p>
            </div>
            {isMyMessage && (
              <img
                src={
                  myProfile?.foto_url ||
                  getAvatarUrl(user?.nama || "D", "0d9488")
                }
                className="w-8 h-8 rounded-full object-cover mt-1"
                alt="Me"
              />
            )}
          </div>
        );
      }
    }

    // DIAGNOSIS
    const isDiagnosis = msg.message.includes("DIAGNOSIS DOKTER");
    if (isDiagnosis && !isMyMessage) {
      return (
        <div className="flex justify-start gap-2 mb-3">
          <img
            src={
              otherProfile?.foto_url ||
              getAvatarUrl(doctorName || "D", "7c3aed")
            }
            className="w-8 h-8 rounded-full object-cover mt-1"
            alt="Doctor"
          />
          <div className="max-w-[80%] bg-purple-50 border-2 border-purple-400 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🩺</span>
              <span className="font-bold text-purple-700">
                DIAGNOSIS DOKTER
              </span>
            </div>
            <div className="text-sm whitespace-pre-line">
              {msg.message
                .replace("🩺 *DIAGNOSIS DOKTER*\n\n", "")
                .split("\n")
                .map((line, i) => (
                  <p key={i} className="mb-1">
                    {line}
                  </p>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formatTime(msg.created_at)}
            </p>
          </div>
        </div>
      );
    }

    // PESAN BIASA
    return (
      <div
        className={`flex ${isMyMessage ? "justify-end" : "justify-start"} gap-2 mb-3`}
      >
        {/* // Di dalam renderMessage, untuk avatar lawan bicara (dokter untuk pasien) */}
        {!isMyMessage && user?.role === "pasien" && (
          <img
            src={doctorPhoto || getAvatarUrl(doctorName || "D", "7c3aed")}
            className="w-8 h-8 rounded-full object-cover mt-1"
            alt="Doctor"
            onError={(e) => {
              e.target.src = getAvatarUrl(doctorName || "D", "7c3aed");
            }}
          />
        )}
        {/* // Untuk avatar lawan bicara (pasien untuk dokter) */}
        {!isMyMessage && user?.role === "dokter" && (
          <img
            src={patientPhoto || getAvatarUrl(patientName || "P", "0891b2")}
            className="w-8 h-8 rounded-full object-cover mt-1"
            alt="Patient"
            onError={(e) => {
              e.target.src = getAvatarUrl(patientName || "P", "0891b2");
            }}
          />
        )}
        <div
          className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
            isMyMessage
              ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
              : "bg-white border border-gray-200"
          }`}
        >
          <p className="text-sm break-words">{msg.message}</p>
          <p
            className={`text-xs mt-1 ${isMyMessage ? "text-cyan-100" : "text-gray-400"}`}
          >
            {formatTime(msg.created_at)}
          </p>
        </div>
        {isMyMessage && (
          <img
            src={
              myProfile?.foto_url || getAvatarUrl(user?.nama || "U", "0d9488")
            }
            className="w-8 h-8 rounded-full object-cover mt-1"
            alt="Me"
          />
        )}
      </div>
    );
  };

  const chatPartnerName =
    user?.role === "pasien" ? doctorName : patientName || "Dokter";
  const chatPartnerAvatar =
    otherProfile?.foto_url || getAvatarUrl(chatPartnerName || "U", "0891b2");

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Chat</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[700px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            <img
              src={chatPartnerAvatar}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
              alt={chatPartnerName}
            />
            <div>
              <h3 className="font-semibold text-lg">
                💬 Chat dengan {chatPartnerName}
              </h3>
              <p className="text-xs text-cyan-100">
                {user?.role === "pasien"
                  ? "Konsultasi dengan dokter"
                  : "Konsultasi dengan pasien"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "dokter" && !showDiagnosisForm && (
              <button
                onClick={() => setShowDiagnosisForm(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                🩺 Diagnosis
              </button>
            )}
            {user?.role === "dokter" && showDiagnosisForm && (
              <button
                onClick={() => setShowDiagnosisForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                ✕ Tutup
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-1 w-8 h-8"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>💬 Belum ada pesan</p>
            </div>
          ) : (
            messages.map((msg) => <div key={msg.id}>{renderMessage(msg)}</div>)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form Diagnosis */}
        {user?.role === "dokter" && showDiagnosisForm && (
          <div className="p-4 border-t bg-purple-50 max-h-80 overflow-y-auto">
            <h4 className="font-bold text-purple-700 mb-3">
              🩺 Form Diagnosis & Resep
            </h4>
            <form onSubmit={sendDiagnosisAndPrescription} className="space-y-3">
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Masukkan diagnosis..."
                rows="3"
                className="w-full border-purple-300 rounded-xl p-3"
                required
              />
              <select
                value={selectedMedicine}
                onChange={(e) => setSelectedMedicine(e.target.value)}
                className="w-full border-purple-300 rounded-xl p-3"
                required
              >
                <option value="">💊 Pilih Obat</option>
                {medicines.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.nama_obat} - Rp {med.harga?.toLocaleString()}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
                placeholder="📌 Dosis"
                className="w-full border-purple-300 rounded-xl p-3"
                required
              />
              <textarea
                value={aturanPakai}
                onChange={(e) => setAturanPakai(e.target.value)}
                placeholder="📝 Aturan pakai"
                rows="2"
                className="w-full border-purple-300 rounded-xl p-3"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiagnosisForm(false)}
                  className="flex-1 bg-gray-300 py-2 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDiagnosis}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-xl"
                >
                  {submittingDiagnosis ? "Mengirim..." : "Kirim"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t bg-white flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 border rounded-xl px-4 py-2"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-cyan-600 text-white px-5 py-2 rounded-xl"
          >
            {sending ? "..." : "Kirim"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
