import { supabaseAdmin } from '../utils/supabaseClient.js';

export const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('orders')
      .select('total_harga, status_pembayaran')
      .eq('status_pembayaran', 'success')
      .gte('tanggal_transaksi', `${targetDate} 00:00:00`)
      .lte('tanggal_transaksi', `${targetDate} 23:59:59`);
    
    if (salesError) throw salesError;
    
    const { data: consultationsData, error: consultationsError } = await supabaseAdmin
      .from('consultations')
      .select('id')
      .eq('status_konsultasi', 'completed')
      .gte('tanggal_konsultasi', `${targetDate} 00:00:00`)
      .lte('tanggal_konsultasi', `${targetDate} 23:59:59`);
    
    if (consultationsError) throw consultationsError;
    
    const totalPenjualan = salesData.reduce((sum, order) => sum + order.total_harga, 0);
    
    res.json({
      success: true,
      data: {
        tanggal: targetDate,
        total_penjualan: totalPenjualan,
        total_transaksi: salesData.length,
        total_konsultasi: consultationsData.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;
    
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('total_harga, tanggal_transaksi')
      .eq('status_pembayaran', 'success')
      .gte('tanggal_transaksi', startDate)
      .lte('tanggal_transaksi', endDate);
    
    if (ordersError) throw ordersError;
    
    const { data: consultations, error: consultationsError } = await supabaseAdmin
      .from('consultations')
      .select('id, tanggal_konsultasi')
      .eq('status_konsultasi', 'completed')
      .gte('tanggal_konsultasi', startDate)
      .lte('tanggal_konsultasi', endDate);
    
    if (consultationsError) throw consultationsError;
    
    const dailyData = {};
    orders.forEach(order => {
      const date = order.tanggal_transaksi.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { penjualan: 0, konsultasi: 0 };
      }
      dailyData[date].penjualan += order.total_harga;
    });
    
    consultations.forEach(consultation => {
      const date = consultation.tanggal_konsultasi.split('T')[0];
      if (dailyData[date]) {
        dailyData[date].konsultasi += 1;
      } else {
        dailyData[date] = { penjualan: 0, konsultasi: 1 };
      }
    });
    
    res.json({
      success: true,
      data: {
        bulan: targetMonth,
        tahun: targetYear,
        total_penjualan: orders.reduce((sum, order) => sum + order.total_harga, 0),
        total_konsultasi: consultations.length,
        detail_harian: dailyData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopMedicines = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('order_details')
      .select(`
        medicine_id,
        jumlah,
        medicines (nama_obat, harga)
      `);
    
    if (error) throw error;
    
    const medicineSales = {};
    data.forEach(item => {
      if (!medicineSales[item.medicine_id]) {
        medicineSales[item.medicine_id] = {
          nama_obat: item.medicines.nama_obat,
          total_terjual: 0,
          total_pendapatan: 0
        };
      }
      medicineSales[item.medicine_id].total_terjual += item.jumlah;
      medicineSales[item.medicine_id].total_pendapatan += item.jumlah * item.medicines.harga;
    });
    
    const topMedicines = Object.values(medicineSales)
      .sort((a, b) => b.total_terjual - a.total_terjual)
      .slice(0, 10);
    
    res.json({ success: true, data: topMedicines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};