import { supabaseAdmin } from '../utils/supabaseClient.js';
import bcrypt from 'bcryptjs';

// Ambil semua profile
export const getProfiles = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting profiles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil profile sendiri
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile sendiri
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama, nomor_telepon, alamat, foto_url, email_notifikasi } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ nama, nomor_telepon, alamat, foto_url, email_notifikasi, updated_at: new Date() })
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    
    // Catat aktivitas
    await supabaseAdmin
      .from('activity_logs')
      .insert([{ user_id: userId, activity: 'Memperbarui profil' }]);
    
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update role user
export const updateProfileRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'dokter', 'pasien'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role tidak valid' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ubah password
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;
    
    // Verifikasi password lama via Supabase Auth
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: req.user.email,
      password: current_password
    });
    
    if (signInError) {
      return res.status(401).json({ success: false, message: 'Password saat ini salah' });
    }
    
    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: new_password
    });
    
    if (error) throw error;
    
    // Catat aktivitas
    await supabaseAdmin
      .from('activity_logs')
      .insert([{ user_id: userId, activity: 'Mengubah password' }]);
    
    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil riwayat aktivitas
export const getActivityLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hapus akun
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    // Verifikasi password
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: req.user.email,
      password: password
    });
    
    if (signInError) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }
    
    // Hapus user dari auth (cascade akan hapus profile, consultations, orders, dll)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Akun berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update last login
export const updateLastLogin = async (req, res) => {
  try {
    const userId = req.user.id;
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date() })
      .eq('id', userId);
    
    // Catat aktivitas login
    await supabaseAdmin
      .from('activity_logs')
      .insert([{ user_id: userId, activity: 'Login ke aplikasi' }]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};