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
        role: 'admin', // ROLE ADMIN, BUKAN DOKTER
        created_at: new Date(),
        updated_at: new Date()
      }, {
        onConflict: 'id'
      });
    
    if (profileError) {
      console.error('❌ Error upserting profile:', profileError);
      return;
    }
    console.log('✅ Admin profile created/updated with role: admin');
    
    // 4. HAPUS data admin dari tabel doctors jika ada (karena admin bukan dokter!)
    console.log('🗑️ Checking and removing admin from doctors table (if exists)...');
    const { data: existingDoctor, error: checkError } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingDoctor) {
      // Jika admin pernah terdaftar sebagai dokter, hapus!
      const { error: deleteError } = await supabaseAdmin
        .from('doctors')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('❌ Error deleting admin from doctors:', deleteError);
      } else {
        console.log('✅ Admin removed from doctors table (admin is NOT a doctor)');
      }
    } else {
      console.log('✅ Admin not found in doctors table (good, admin should not be a doctor)');
    }
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ DEFAULT ADMIN CREATED/UPDATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name: ${adminNama}`);
    console.log(`🎭 Role: ADMIN (NOT A DOCTOR)`);
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Fatal error creating admin:', error);
  }
};

// Jalankan jika file ini dipanggil langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  createDefaultAdmin();
}

export default createDefaultAdmin;