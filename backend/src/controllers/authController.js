import { supabase, supabaseAdmin } from '../utils/supabaseClient.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { email, password, nama, nomor_telepon, alamat, role } = req.body;

    console.log('📝 Register attempt:', email);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama, nomor_telepon, alamat },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      
      // Handle rate limit
      if (authError.status === 429 || authError.message?.includes('rate limit')) {
        return res.status(429).json({ 
          success: false, 
          message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 1 jam atau gunakan email lain.' 
        });
      }
      
      if (authError.message?.includes('already registered')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email sudah terdaftar. Silakan login.' 
        });
      }
      
      return res.status(400).json({ success: false, message: authError.message });
    }

    console.log('✅ User registered:', authData.user?.id);

    // Buat profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{
        id: authData.user.id,
        email,
        nama,
        nomor_telepon: nomor_telepon || '',
        alamat: alamat || '',
        role: role || 'pasien'
      }]);

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    }

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil! Silakan cek email Anda (termasuk folder SPAM) untuk verifikasi.',
      user: { 
        id: authData.user.id, 
        email, 
        nama, 
        role: role || 'pasien',
        email_confirmed: false
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      
      if (authError.code === 'email_not_confirmed') {
        return res.status(401).json({ 
          success: false, 
          message: 'Email belum diverifikasi. Silakan cek inbox atau folder SPAM Anda.', 
          code: 'email_not_confirmed' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah. Periksa kembali.' 
      });
    }

    // Ambil profile
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profil tidak ditemukan. Silakan registrasi ulang.' 
      });
    }

    console.log('✅ Profile found:', profile.email, 'Role:', profile.role);

    const token = jwt.sign(
      { id: profile.id, email: profile.email, role: profile.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: profile.id,
        email: profile.email,
        nama: profile.nama,
        role: profile.role,
        nomor_telepon: profile.nomor_telepon,
        alamat: profile.alamat,
        foto_url: profile.foto_url
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
      }
    });

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Email verifikasi telah dikirim ulang. Cek inbox atau SPAM Anda.' 
    });
  } catch (error) {
    console.error('❌ Resend error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};