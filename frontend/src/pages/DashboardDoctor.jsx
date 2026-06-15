import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import ChatRoom from "../components/Chat/ChatRoom";

const DashboardDoctor = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("consultations");
  const [consultations, setConsultations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [paymentStats, setPaymentStats] = useState({ total: 0, paid: 0, pending: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching doctor data for user:", user.id);
      
      const doctorsResponse = await api.get("/doctors");
      const doctor = doctorsResponse.data.data.find(
        (d) => d.user_id === user.id
      );
      
      if (!doctor) {
        setConsultations([]);
        setStats({ total: 0, pending: 0, completed: 0 });
        setLoading(false);
        return;
      }
      
      console.log("Doctor found:", doctor.id, doctor.nama_dokter);
      
      const consultationsResponse = await api.get(`/consultations/doctor/${doctor.id}`);
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

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setPaymentsLoading(true);
    try {
      const doctorsResponse = await api.get("/doctors");
      const doctor = doctorsResponse.data.data.find(
        (d) => d.user_id === user.id
      );
      
      if (doctor) {
        const res = await api.get("/consultation-payments/doctor");
        const data = res.data.data || [];
        setPayments(data);
        setPaymentStats({
          total: data.reduce((sum, p) => sum + p.amount, 0),
          paid: data.filter(p => p.payment_status === "paid").reduce((sum, p) => sum + p.amount, 0),
          pending: data.filter(p => p.payment_status === "pending").reduce((sum, p) => sum + p.amount, 0)
        });
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    fetchPayments();
  }, [fetchData, fetchPayments]);

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
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-rose-100 text-rose-700 border-rose-200",
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

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID').format(value || 0);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
            <div className="text-rose-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-rose-700 mb-2">Gagal Memuat Data</h2>
            <p className="text-rose-600">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition">Muat Ulang Halaman</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">👨‍⚕️ Dashboard Dokter</h1>
            </div>
          </div>
        </div>

        {/* Stat Cards - Warna hijau */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Konsultasi</p>
                <p className="text-3xl font-bold text-green-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Menunggu Diagnosis</p>
                <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Konsultasi Selesai</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Pendapatan</p>
                <p className="text-3xl font-bold text-green-600">Rp {formatRupiah(paymentStats.paid)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 16h6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Warna hijau */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("consultations")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition-all ${
              activeTab === "consultations" 
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                : "text-gray-500 hover:text-green-600"
            }`}
          >
            📋 Konsultasi Pasien
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-5 py-2.5 font-medium rounded-t-xl transition-all ${
              activeTab === "payments" 
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                : "text-gray-500 hover:text-green-600"
            }`}
          >
            💰 Riwayat Pembayaran
          </button>
        </div>

        {/* Consultation List Tab */}
        {activeTab === "consultations" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Daftar Konsultasi Pasien
              </h2>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : consultations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="text-gray-400">Belum ada konsultasi pasien</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition hover:border-green-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={consultation.profiles?.foto_url || `https://ui-avatars.com/api/?background=0d9488&color=fff&name=${consultation.profiles?.nama?.charAt(0) || 'P'}`} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
                            alt="Patient"
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?background=0d9488&color=fff&name=${consultation.profiles?.nama?.charAt(0) || 'P'}` }}
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(consultation.status_konsultasi)}`}>
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
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 16h6" />
                </svg>
                Riwayat Pembayaran Konsultasi
              </h2>
            </div>
            
            <div className="p-6">
              {paymentsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">💰</div>
                  <p className="text-gray-400">Belum ada pembayaran</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pasien</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keluhan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-green-50 transition">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(payment.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {payment.profiles?.nama}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {payment.consultations?.keluhan?.substring(0, 50)}...
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">
                            Rp {formatRupiah(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {payment.payment_method === 'bank_transfer' ? '🏦 Transfer Bank' :
                             payment.payment_method === 'qris' ? '📱 QRIS' :
                             payment.payment_method === 'virtual_account' ? '🏧 VA' : payment.payment_method}
                          </td>
                          <td className="px-4 py-3">
                            {payment.payment_status === 'pending' && (
                              <span className="text-amber-600 text-sm flex items-center gap-1">
                                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Menunggu
                              </span>
                            )}
                            {payment.payment_status === 'paid' && (
                              <span className="text-green-600 text-sm flex items-center gap-1">✅ Dibayar</span>
                            )}
                            {payment.payment_status === 'failed' && (
                              <span className="text-red-600 text-sm flex items-center gap-1">❌ Ditolak</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
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