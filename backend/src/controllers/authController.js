import { supabase, supabaseAdmin } from '../utils/supabaseClient.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { email, password, nama, nomor_telepon, alamat, role } = req.body;

    console.log('📝 Register attempt:', email);

    // Register user dengan Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama: nama,
          nomor_telepon: nomor_telepon,
          alamat: alamat,
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return res.status(400).json({ success: false, message: authError.message });
    }

    console.log('✅ User registered:', authData.user?.id);

    // BUAT PROFILE LANGSUNG DI SINI (jangan tunggu verifikasi)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{
        id: authData.user.id,
        email: email,
        nama: nama,
        nomor_telepon: nomor_telepon || '',
        alamat: alamat || '',
        role: role || 'pasien'
      }]);

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      // Tetap lanjutkan, jangan gagalkan register
    } else {
      console.log('✅ Profile created for:', email);
    }

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.',
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
          message: 'Email belum diverifikasi. Silakan cek inbox atau folder SPAM Anda.' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }

    // Ambil profile dari tabel profiles
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Jika profile tidak ditemukan, buat profile baru (fallback)
    if (profileError || !profile) {
      console.log('📝 Profile not found, creating fallback profile for:', authData.user.id);
      
      const userMetadata = authData.user.user_metadata;
      
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .upsert([{
          id: authData.user.id,
          email: email,
          nama: userMetadata?.nama || email.split('@')[0],
          nomor_telepon: userMetadata?.nomor_telepon || '',
          alamat: userMetadata?.alamat || '',
          role: 'pasien'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create profile:', insertError);
        return res.status(404).json({ 
          success: false, 
          message: 'Profil tidak ditemukan. Silakan registrasi ulang.' 
        });
      }
      
      profile = newProfile;
      console.log('✅ Fallback profile created');
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