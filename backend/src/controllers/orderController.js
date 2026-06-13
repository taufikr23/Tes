import { supabaseAdmin } from '../utils/supabaseClient.js';

export const createOrder = async (req, res) => {
  try {
    const { user_id, items, total_harga } = req.body;
    
    console.log('=== CREATE ORDER ===');
    console.log('user_id:', user_id);
    console.log('items:', items);
    console.log('total_harga:', total_harga);
    
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID diperlukan' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Item pesanan tidak boleh kosong' });
    }
    
    // Check stock
    for (const item of items) {
      const { data: medicine, error } = await supabaseAdmin
        .from('medicines')
        .select('stok, nama_obat')
        .eq('id', item.medicine_id)
        .single();
      
      if (error || !medicine) {
        return res.status(400).json({ 
          success: false, 
          message: `Obat tidak ditemukan` 
        });
      }
      
      if (medicine.stok < item.jumlah) {
        return res.status(400).json({ 
          success: false, 
          message: `Stok ${medicine.nama_obat} tidak mencukupi. Sisa stok: ${medicine.stok}` 
        });
      }
    }
    
    // Create order - gunakan status 'pending' (menunggu pembayaran)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id,
        total_harga,
        status_pembayaran: 'pending'  // 'pending' = menunggu pembayaran
      }])
      .select();
    
    if (orderError) {
      console.error('Order error:', orderError);
      throw orderError;
    }
    
    console.log('Order created:', order[0]);
    
    // Create order details and update stock
    for (const item of items) {
      await supabaseAdmin
        .from('order_details')
        .insert([{
          order_id: order[0].id,
          medicine_id: item.medicine_id,
          jumlah: item.jumlah,
          subtotal: item.subtotal
        }]);
      
      // Update stock
      const { data: medicine } = await supabaseAdmin
        .from('medicines')
        .select('stok')
        .eq('id', item.medicine_id)
        .single();
      
      await supabaseAdmin
        .from('medicines')
        .update({ stok: medicine.stok - item.jumlah })
        .eq('id', item.medicine_id);
    }
    
    res.status(201).json({ success: true, data: order[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_details (
          *,
          medicines (id, nama_obat, harga, gambar, stok)
        )
      `)
      .eq('user_id', userId)
      .order('tanggal_transaksi', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_details (
          *,
          medicines (id, nama_obat, harga, gambar)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_pembayaran } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status_pembayaran })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};