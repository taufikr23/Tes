import { supabaseAdmin } from '../utils/supabaseClient.js';

// Create payment
export const createPayment = async (req, res) => {
  try {
    const { order_id, user_id, amount, payment_method, payment_proof, notes } = req.body;

    // Cek apakah sudah ada payment untuk order ini
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, payment_status')
      .eq('order_id', order_id)
      .maybeSingle();

    // Jika sudah ada payment yang pending atau verified, tolak buat baru
    if (existingPayment && (existingPayment.payment_status === 'pending' || existingPayment.payment_status === 'verified')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sudah ada pembayaran yang diproses untuk pesanan ini' 
      });
    }

    // Jika ada payment yang ditolak, update saja (upload ulang)
    if (existingPayment && existingPayment.payment_status === 'rejected') {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .update({ 
          payment_method, 
          payment_proof, 
          notes,
          payment_status: 'pending',
          verified_by: null,
          verified_at: null,
          updated_at: new Date()
        })
        .eq('id', existingPayment.id)
        .select();

      if (error) throw error;

      // Update order status menjadi pending
      await supabaseAdmin
        .from('orders')
        .update({ status_pembayaran: 'pending' })
        .eq('id', order_id);

      return res.status(200).json({ success: true, data: data[0], message: 'Bukti pembayaran berhasil diupload ulang' });
    }

    // Buat payment baru
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        order_id,
        user_id,
        amount,
        payment_method,
        payment_proof,
        notes,
        payment_status: 'pending'
      }])
      .select();

    if (error) throw error;

    await supabaseAdmin
      .from('orders')
      .update({ status_pembayaran: 'pending' })
      .eq('id', order_id);

    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment (admin)
export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, notes } = req.body;
    const adminId = req.user.id;

    console.log('=== VERIFY PAYMENT ===');
    console.log('Payment ID:', id);
    console.log('Payment status:', payment_status);

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({ 
        payment_status, 
        notes: notes || null,
        verified_by: adminId,
        verified_at: new Date()
      })
      .eq('id', id)
      .select();

    if (paymentError) throw paymentError;

    // Update order status berdasarkan verifikasi
    let orderStatus = '';
    if (payment_status === 'verified') {
      orderStatus = 'success';
    } else if (payment_status === 'rejected') {
      orderStatus = 'failed';
    } else {
      orderStatus = 'pending';
    }

    await supabaseAdmin
      .from('orders')
      .update({ status_pembayaran: orderStatus })
      .eq('id', payment[0].order_id);

    res.json({ success: true, data: payment[0] });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment by order
export const getPaymentByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all payments (admin)
export const getAllPayments = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, orders(*), profiles!user_id(nama, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my payments
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, orders(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};