import { supabaseAdmin } from '../utils/supabaseClient.js';

// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        *,
        profiles!user_id (
          id,
          nama,
          email,
          foto_url,
          nomor_telepon,
          alamat
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const doctorsWithPhotos = data.map(doctor => ({
      ...doctor,
      foto_url: doctor.foto || doctor.profiles?.foto_url || null,
      nama_dokter: doctor.nama_dokter || doctor.profiles?.nama || 'Dokter'
    }));
    
    res.json({ success: true, data: doctorsWithPhotos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        *,
        profiles!user_id (
          id,
          nama,
          email,
          foto_url,
          nomor_telepon,
          alamat
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const doctorWithPhoto = {
      ...data,
      foto_url: data.foto || data.profiles?.foto_url || null
    };
    
    res.json({ success: true, data: doctorWithPhoto });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor by user_id (untuk dashboard dokter)
export const getDoctorByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        *,
        profiles!user_id (
          id,
          nama,
          email,
          foto_url,
          nomor_telepon,
          alamat
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    
    if (data) {
      const doctorWithPhoto = {
        ...data,
        foto_url: data.foto || data.profiles?.foto_url || null
      };
      res.json({ success: true, data: doctorWithPhoto });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor (bisa oleh admin atau dokter itu sendiri)
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    
    // Cek data dokter yang akan diupdate
    const { data: doctor, error: fetchError } = await supabaseAdmin
      .from('doctors')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return res.status(404).json({ success: false, message: 'Dokter tidak ditemukan' });
    }
    
    // Cek role user
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    // Izinkan jika: admin ATAU dokter yang bersangkutan
    const isAdmin = profile?.role === 'admin';
    const isOwnDoctor = doctor.user_id === userId;
    
    if (!isAdmin && !isOwnDoctor) {
      return res.status(403).json({ 
        success: false, 
        message: 'Anda tidak memiliki akses untuk mengupdate data dokter ini' 
      });
    }
    
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create doctor
export const createDoctor = async (req, res) => {
  try {
    const { user_id, nama_dokter, spesialis, biaya_konsultasi, jadwal_praktik, foto } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .insert([{ user_id, nama_dokter, spesialis, biaya_konsultasi, jadwal_praktik, foto }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('doctors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkStock = async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const { data, error } = await supabaseAdmin
      .from('medicines')
      .select('stok')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    const available = data.stok >= quantity;
    res.json({ success: true, available, currentStock: data.stok });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};