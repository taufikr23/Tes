import { supabaseAdmin } from '../utils/supabaseClient.js';

export const sendPrescriptionViaChat = async (req, res) => {
  try {
    const { consultation_id, sender_id, receiver_id, prescription_data } = req.body;
    
    // Kirim pesan dengan format JSON yang bisa di-render sebagai komponen
    const message = {
      type: 'prescription',
      data: {
        obat_id: prescription_data.medicine_id,
        nama_obat: prescription_data.nama_obat,
        dosis: prescription_data.dosis,
        aturan_pakai: prescription_data.aturan_pakai,
        harga: prescription_data.harga,
        consultation_id: consultation_id
      }
    };
    
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{ 
        consultation_id, 
        sender_id, 
        receiver_id, 
        message: JSON.stringify(message),
        is_read: false,
        created_at: new Date()
      }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error sending prescription via chat:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};