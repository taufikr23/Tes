import { supabaseAdmin } from '../utils/supabaseClient.js';

export const getDoctors = async (req, res) => {
  try {
    // Ambil data dokter sekaligus JOIN dengan profiles untuk mendapatkan role
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        *,
        profiles!user_id (
          id,
          nama,
          email,
          role
        )
      `);
    
    if (error) throw error;
    
    // Filter hanya dokter yang role-nya 'dokter' (bukan admin)
    const filteredDoctors = data.filter(doctor => 
      doctor.profiles?.role === 'dokter'
    );
    
    res.json({ success: true, data: filteredDoctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select('*, profiles(nama, email, nomor_telepon)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { user_id, nama_dokter, spesialis, biaya_konsultasi, jadwal_praktik, foto } = req.body;
    
    // Check if user exists and has role 'dokter'
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();
    
    if (userError || !user) throw new Error('User not found');
    
    if (user.role !== 'dokter') {
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'dokter' })
        .eq('id', user_id);
    }
    
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .insert([{
        user_id,
        nama_dokter,
        spesialis,
        biaya_konsultasi,
        jadwal_praktik,
        foto
      }])
      .select();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    res.json({ success: true, data: data[0] });
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