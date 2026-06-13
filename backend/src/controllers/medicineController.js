import { supabaseAdmin } from '../utils/supabaseClient.js';

export const getMedicines = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('medicines')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('medicines')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const { nama_obat, kategori, harga, stok, deskripsi, gambar } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('medicines')
      .insert([{
        nama_obat,
        kategori,
        harga,
        stok,
        deskripsi,
        gambar
      }])
      .select();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('medicines')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('medicines')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkStock = async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const { data, error } = await supabaseAdmin
      .from('medicines')
      .select('stok')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const available = data.stok >= quantity;
    res.json({ success: true, available, currentStock: data.stok });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};