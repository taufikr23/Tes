import { supabaseAdmin } from './supabaseClient.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    console.log('🚀 Checking default admin...');
    
    const adminEmail = 'admin@tmedic.com';
    const adminPassword = 'admin123456';
    const adminNama = 'Super Admin';
    const adminPhone = '081234567890';
    const adminAlamat = 'Jakarta, Indonesia';
    
    // 1. Cek apakah admin sudah ada di Supabase Auth
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }
    
    const existingAdmin = existingUsers.users.find(user => user.email === adminEmail);
    
    let userId;
    
    if (!existingAdmin) {
      // 2. Buat user baru di Supabase Auth
      console.log('📝 Creating admin user in Supabase Auth...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Langsung konfirmasi email
        user_metadata: {
          nama: adminNama,
          nomor_telepon: adminPhone,
          alamat: adminAlamat
        }
      });
      
      if (createError) {
        console.error('❌ Error creating admin:', createError);
        return;
      }
      
      userId = newUser.user.id;
      console.log('✅ Admin user created with ID:', userId);
    } else {
      userId = existingAdmin.id;
      console.log('✅ Admin user already exists with ID:', userId);
    }
    
    // 3. Buat atau update profile di tabel profiles
    console.log('📝 Upserting admin profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: adminEmail,
        nama: adminNama,
        nomor_telepon: adminPhone,
        alamat: adminAlamat,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }, {
        onConflict: 'id'
      });
    
    if (profileError) {
      console.error('❌ Error upserting profile:', profileError);
      return;
    }
    
    // 4. Cek apakah admin sudah punya data di tabel doctors (opsional)
    const { data: existingDoctor } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!existingDoctor) {
      // Admin juga bisa berperan sebagai dokter (opsional)
      console.log('📝 Adding doctor record for admin (optional)...');
      const { error: doctorError } = await supabaseAdmin
        .from('doctors')
        .insert({
          user_id: userId,
          nama_dokter: adminNama,
          spesialis: 'Admin',
          biaya_konsultasi: 0,
          jadwal_praktik: 'Senin - Jumat, 09:00 - 17:00'
        });
      
      if (doctorError) {
        console.log('⚠️ Doctor record not created (not required for admin):', doctorError.message);
      } else {
        console.log('✅ Doctor record created');
      }
    }
    

    
  } catch (error) {
    console.error('❌ Fatal error creating admin:', error);
  }
};

// Jalankan jika file ini dipanggil langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  createDefaultAdmin();
}

export default createDefaultAdmin;