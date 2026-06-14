import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import ChatRoom from "../components/Chat/ChatRoom";

const DashboardDoctor = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching doctor data for user:", user.id);
      
      // Step 1: Ambil data dokter berdasarkan user_id
      const doctorsResponse = await api.get("/doctors");
      console.log("All doctors:", doctorsResponse.data);
      
      const doctor = doctorsResponse.data.data.find(
        (d) => d.user_id === user.id
      );
      
      if (!doctor) {
        console.log("Doctor not found for user:", user.id);
        setConsultations([]);
        setStats({ total: 0, pending: 0, completed: 0 });
        setLoading(false);
        return;
      }
      
      console.log("Doctor found:", doctor.id, doctor.nama_dokter);
      
      // Step 2: Ambil konsultasi berdasarkan doctor_id
      const consultationsResponse = await api.get(`/consultations/doctor/${doctor.id}`);
      console.log("Consultations:", consultationsResponse.data);
      
      const data = consultationsResponse.data.data || [];
      setConsultations(data);
      setStats({
        total: data.length,
        pending: data.filter(c => c.status_konsultasi === "pending").length,
        completed: data.filter(c => c.status_konsultasi === "completed").length
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Gagal memuat data konsultasi");
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenChat = (consultation) => {
    const doctorPhoto = user?.foto_url;
    const patientPhoto = consultation.profiles?.foto_url;
    
    setSelectedChat({
      ...consultation,
      doctorPhoto: doctorPhoto,
      patientPhoto: patientPhoto,
      doctorName: user?.nama,
      patientName: consultation.profiles?.nama
    });
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedChat(null);
    fetchData();
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending: "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-rose-100 text-rose-700",
    };
    return statuses[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusText = (status) => {
    const texts = { pending: "Menunggu", completed: "Selesai", cancelled: "Dibatalkan" };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
            <div className="text-rose-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-rose-700 mb-2">Gagal Memuat Data</h2>
            <p className="text-rose-600">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 transition">Muat Ulang Halaman</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-800">👨‍⚕️ Dashboard Dokter</h1>
          <p className="text-gray-500 mt-1">Selamat datang, dr. {user?.nama?.split(' ')[0]}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Konsultasi</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Menunggu Diagnosis</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Konsultasi Selesai</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation List */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
            <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Daftar Konsultasi Pasien
            </h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-400">Belum ada konsultasi pasien</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div key={consultation.id} className="border border-emerald-100 rounded-xl p-4 hover:shadow-md transition hover:border-emerald-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={consultation.profiles?.foto_url || `https://ui-avatars.com/api/?background=0891b2&color=fff&name=${consultation.profiles?.nama?.charAt(0) || 'P'}`} 
                          className="w-10 h-10 rounded-full object-cover"
                          alt="Patient"
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?background=0891b2&color=fff&name=${consultation.profiles?.nama?.charAt(0) || 'P'}` }}
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {consultation.profiles?.nama || "Pasien"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(consultation.tanggal_konsultasi)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(consultation.status_konsultasi)}`}>
                        {getStatusText(consultation.status_konsultasi)}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium text-gray-700">Keluhan:</span> {consultation.keluhan}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleOpenChat(consultation)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      💬 Chat Pasien
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Chat */}
      {showChat && selectedChat && (
        <ChatRoom
          consultationId={selectedChat}
          doctorName={selectedChat.doctorName}
          patientName={selectedChat.patientName}
          doctorPhoto={selectedChat.doctorPhoto}
          patientPhoto={selectedChat.patientPhoto}
          onClose={handleCloseChat}
          onDiagnosisSent={fetchData}
        />
      )}
    </div>
  );
};

export default DashboardDoctor;