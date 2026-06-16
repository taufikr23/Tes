import { supabaseAdmin } from '../utils/supabaseClient.js';

export const createOrder = async (req, res) => {
  try {
    const { user_id, items, total_harga } = req.body;
    
    console.log('=== CREATE ORDER ===');
    console.log('user_id:', user_id);
    console.log('items:', items);
    console.log('total_harga:', total_harga);
    
    // Validasi input
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID diperlukan' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Item pesanan tidak boleh kosong' });
    }
    
    // VALIDASI STOCK - Simpan data stok sementara
    const stockData = [];
    for (const item of items) {
      const { data: medicine, error } = await supabaseAdmin
        .from('medicines')
        .select('stok, nama_obat')
        .eq('id', item.medicine_id)
        .single();
      
      if (error || !medicine) {
        return res.status(400).json({ 
          success: false, 
          message: `Obat dengan ID ${item.medicine_id} tidak ditemukan` 
        });
      }
      
      const jumlahBeli = parseInt(item.jumlah);
      
      if (medicine.stok < jumlahBeli) {
        return res.status(400).json({ 
          success: false, 
          message: `Stok ${medicine.nama_obat} tidak mencukupi. Sisa stok: ${medicine.stok}` 
        });
      }
      
      // Simpan data stok untuk update nanti
      stockData.push({
        medicine_id: item.medicine_id,
        current_stock: medicine.stok,
        quantity: jumlahBeli,
        new_stock: medicine.stok - jumlahBeli
      });
    }
    
    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id,
        total_harga: parseInt(total_harga),
        status_pembayaran: 'pending'
      }])
      .select();
    
    if (orderError) {
      console.error('Order error:', orderError);
      throw orderError;
    }
    
    console.log('Order created:', order[0]);
    
    // CREATE ORDER DETAILS 
    for (const item of items) {
      const medicineId = item.medicine_id;
      const jumlahBeli = parseInt(item.jumlah);
      const subtotal = parseInt(item.subtotal);
      
      const { error: detailError } = await supabaseAdmin
        .from('order_details')
        .insert([{
          order_id: order[0].id,
          medicine_id: medicineId,
          jumlah: jumlahBeli,
          subtotal: subtotal
        }]);
      
      if (detailError) {
        console.error('Detail error:', detailError);
        throw detailError;
      }
      
      console.log(`Order detail created for medicine ${medicineId}`);
    }
    
    // UPDATE STOCK - Dilakukan SEKALI di luar loop item
    for (const stock of stockData) {
      const { error: updateError } = await supabaseAdmin
        .from('medicines')
        .update({ stok: stock.new_stock })
        .eq('id', stock.medicine_id);
      
      if (updateError) {
        console.error('Update stock error:', updateError);
        throw updateError;
      }
      
      console.log(`Stock updated: ${stock.medicine_id} from ${stock.current_stock} to ${stock.new_stock}`);
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
    console.error('Error getting orders:', error);
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
    console.error('Error getting order:', error);
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
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};  