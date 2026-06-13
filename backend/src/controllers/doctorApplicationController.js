import { supabaseAdmin } from '../utils/supabaseClient.js';

// Pasien mengajukan jadi dokter
export const createApplication = async (req, res) => {
  try {
    const { user_id, nama_dokter, spesialis, biaya_konsultasi, jadwal_praktik, foto } = req.body;

    // Cek apakah user sudah punya pengajuan pending
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('doctor_applications')
      .select('id, status')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Anda sudah memiliki pengajuan yang sedang diproses' 
      });
    }

    // Cek apakah user sudah menjadi dokter
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    if (profile?.role === 'dokter') {
      return res.status(400).json({ 
        success: false, 
        message: 'Anda sudah terdaftar sebagai dokter' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('doctor_applications')
      .insert([{
        user_id,
        nama_dokter,
        spesialis,
        biaya_konsultasi,
        jadwal_praktik,
        foto,
        status: 'pending'
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      data: data[0],
      message: 'Pengajuan berhasil dikirim. Menunggu persetujuan admin.'
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil semua pengajuan (untuk admin)
export const getAllApplications = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctor_applications')
      .select('*, profiles!user_id(nama, email, nomor_telepon)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil pengajuan milik sendiri (untuk pasien)
export const getMyApplications = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('doctor_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting my applications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin approve pengajuan (DENGAN TAMBAHAN Dr.)
// Admin approve pengajuan
// Admin approve pengajuan
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data pengajuan
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('doctor_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!application) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Update status pengajuan
    const { error: updateError } = await supabaseAdmin
      .from('doctor_applications')
      .update({ status: 'approved', pesan_penolakan: null })
      .eq('id', id);

    if (updateError) throw updateError;

    // Ubah role user menjadi dokter
    const { error: roleError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'dokter' })
      .eq('id', application.user_id);

    if (roleError) throw roleError;

    // Tambahkan ke tabel doctors dengan menambahkan "Dr." di depan nama
    const doctorName = application.nama_dokter.startsWith('Dr.') 
      ? application.nama_dokter 
      : `Dr. ${application.nama_dokter}`;

    const { error: doctorError } = await supabaseAdmin
      .from('doctors')
      .insert([{
        user_id: application.user_id,
        nama_dokter: doctorName,
        spesialis: application.spesialis,
        biaya_konsultasi: application.biaya_konsultasi,
        jadwal_praktik: application.jadwal_praktik,
        foto: application.foto
      }]);

    if (doctorError) throw doctorError;

    // Kirim response dengan flag untuk logout
    res.json({ 
      success: true, 
      message: 'Selamat! Pengajuan Anda telah disetujui. Anda sekarang menjadi dokter. Silakan login kembali.',
      user_id: application.user_id,
      role: 'dokter',
      force_logout: true
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Admin reject pengajuan
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { pesan_penolakan } = req.body;

    const { error } = await supabaseAdmin
      .from('doctor_applications')
      .update({ status: 'rejected', pesan_penolakan })
      .eq('id', id);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Pengajuan ditolak.' 
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};