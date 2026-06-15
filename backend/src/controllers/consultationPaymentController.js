import { supabaseAdmin } from '../utils/supabaseClient.js';

// Create consultation payment
export const createConsultationPayment = async (req, res) => {
  try {
    const { consultation_id, user_id, doctor_id, amount, payment_method, payment_proof, notes } = req.body;

    console.log('Creating consultation payment:', { consultation_id, user_id, doctor_id, amount });

    const { data: existingPayment, error: checkError } = await supabaseAdmin
      .from('consultation_payments')
      .select('id, payment_status')
      .eq('consultation_id', consultation_id)
      .maybeSingle();

    if (existingPayment && existingPayment.payment_status === 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Pembayaran untuk konsultasi ini sudah lunas' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('consultation_payments')
      .insert([{
        consultation_id,
        user_id,
        doctor_id,
        amount,
        payment_method,
        payment_proof,
        notes: notes || null,
        payment_status: 'pending'
      }])
      .select();

    if (error) throw error;

    await supabaseAdmin
      .from('consultations')
      .update({ status_konsultasi: 'pending_payment' })
      .eq('id', consultation_id);

    res.status(201).json({ 
      success: true, 
      data: data[0],
      message: 'Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.'
    });
  } catch (error) {
    console.error('Error creating consultation payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments for a doctor
export const getDoctorPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: doctor } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Dokter tidak ditemukan' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('consultation_payments')
      .select(`
        *,
        consultations!consultation_id (
          id,
          keluhan,
          tanggal_konsultasi,
          status_konsultasi
        ),
        profiles!user_id (
          id,
          nama,
          email
        )
      `)
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting doctor payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all consultation payments (admin)
export const getAllConsultationPayments = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('consultation_payments')
      .select(`
        *,
        consultations!consultation_id (
          id,
          keluhan,
          tanggal_konsultasi,
          status_konsultasi
        ),
        profiles!user_id (
          id,
          nama,
          email
        ),
        doctors!doctor_id (
          id,
          nama_dokter,
          spesialis
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting all consultation payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment (admin)
export const verifyConsultationPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, notes } = req.body;
    const adminId = req.user.id;

    console.log('Verifying payment:', { id, payment_status, notes });

    const updateData = { 
      payment_status, 
      verified_by: adminId,
      verified_at: new Date()
    };
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (payment_status === 'paid') {
      updateData.payment_date = new Date();
    }

    const { data: payment, error } = await supabaseAdmin
      .from('consultation_payments')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    if (payment_status === 'paid') {
      await supabaseAdmin
        .from('consultations')
        .update({ status_konsultasi: 'pending' })
        .eq('id', payment[0].consultation_id);
      
      console.log(`✅ Payment verified for consultation ${payment[0].consultation_id}`);
    } else if (payment_status === 'failed') {
      await supabaseAdmin
        .from('consultations')
        .update({ status_konsultasi: 'cancelled' })
        .eq('id', payment[0].consultation_id);
      
      console.log(`❌ Payment rejected for consultation ${payment[0].consultation_id}`);
    }

    res.json({ success: true, data: payment[0] });
  } catch (error) {
    console.error('Error verifying consultation payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};