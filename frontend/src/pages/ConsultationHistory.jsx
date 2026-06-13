import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import ChatRoom from "../components/Chat/ChatRoom";

const ConsultationHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const [lastMessages, setLastMessages] = useState({});

  useEffect(() => {
    fetchConsultations();
    fetchUnreadCounts();

    // Auto refresh setiap 3 detik
    const interval = setInterval(() => {
      fetchUnreadCounts();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Ambil pesan terakhir untuk setiap konsultasi
  useEffect(() => {
    if (consultations.length > 0) {
      consultations.forEach(async (consultation) => {
        try {
          const res = await api.get(`/chat/${consultation.id}`);
          const messages = res.data.data || [];
          if (messages.length > 0) {
            setLastMessages((prev) => ({
              ...prev,
              [consultation.id]: messages[messages.length - 1],
            }));
          }
        } catch (err) {
          console.error("Error fetching last message:", err);
        }
      });
    }
  }, [consultations]);

  const fetchConsultations = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/consultations/user/${user.id}`);
      setConsultations(response.data.data);
    } catch (error) {
      console.error("Error fetching consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get("/chat/unread/by-consultation");
      console.log("Unread data:", res.data);
      setUnreadMap(res.data.data || {});
    } catch (err) {
      console.error("Error fetching unread counts:", err);
    }
  };

  const handleOpenChat = async (consultation) => {
    // Tandai pesan sebagai sudah dibaca
    try {
      await api.put(`/chat/read/${consultation.id}`);
      setUnreadMap((prev) => ({ ...prev, [consultation.id]: 0 }));
    } catch (err) {
      console.error("Error marking as read:", err);
    }

    setSelectedChat(consultation);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedChat(null);
    fetchUnreadCounts();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-800">
            💬 Riwayat Konsultasi
          </h1>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full animate-pulse">
              {totalUnread} pesan baru
            </span>
          )}
        </div>

        {consultations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-8 text-center">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-400">Belum ada konsultasi</p>
            <button
              onClick={() => navigate("/consultation")}
              className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg"
            >
              Mulai Konsultasi
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.map((consultation) => {
              const unreadCount = unreadMap[consultation.id] || 0;
              const lastMessage = lastMessages[consultation.id];
              const isLastMessageFromDoctor =
                lastMessage?.sender_id !== user?.id;

              return (
                <div
                  key={consultation.id}
                  className={`bg-white rounded-xl shadow-sm border transition hover:shadow-md ${
                    unreadCount > 0
                      ? "border-emerald-400 bg-emerald-50/30"
                      : "border-emerald-100"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-600 font-bold text-lg">
                            {consultation.doctors?.nama_dokter?.charAt(0) ||
                              "D"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-800">
                              {consultation.doctors?.nama_dokter || "Dokter"}
                            </h3>
                            {lastMessage && (
                              <span className="text-xs text-gray-400">
                                {formatDate(lastMessage.created_at)}
                              </span>
                            )}
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {/* Tampilkan pesan terakhir */}
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {lastMessage ? (
                              <>
                                <span className="font-medium">
                                  {isLastMessageFromDoctor
                                    ? `${consultation.doctors?.nama_dokter}: `
                                    : "Anda: "}
                                </span>
                                {lastMessage.message?.substring(0, 50)}
                                {lastMessage.message?.length > 50 && "..."}
                              </>
                            ) : (
                              "Belum ada pesan"
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenChat(consultation)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                          unreadCount > 0
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        💬 Chat
                        {unreadCount > 0 && (
                          <span className="bg-white text-emerald-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Status konsultasi */}
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          consultation.status_konsultasi === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {consultation.status_konsultasi === "completed"
                          ? "✅ Selesai"
                          : "⏳ Aktif"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Chat */}
      {showChat && selectedChat && (
        <ChatRoom
          consultationId={selectedChat}
          doctorName={selectedChat.doctors?.nama_dokter}
          patientName={user?.nama}
          doctorPhoto={selectedChat.doctors?.foto_url}
          patientPhoto={user?.foto_url}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default ConsultationHistory;
