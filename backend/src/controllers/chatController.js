import { supabaseAdmin } from '../utils/supabaseClient.js';

// Ambil pesan berdasarkan consultation_id
export const getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kirim pesan baru
export const sendMessage = async (req, res) => {
  try {
    const { consultation_id, sender_id, receiver_id, message } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{ 
        consultation_id, 
        sender_id, 
        receiver_id, 
        message,
        is_read: false,
        created_at: new Date()
      }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tandai pesan sebagai sudah dibaca (per ID)
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hitung total pesan belum dibaca
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { count, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    res.json({ success: true, unread_count: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hitung pesan belum dibaca per konsultasi
export const getUnreadCountByConsultation = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('consultation_id')
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    // Hitung jumlah per consultation_id
    const unreadMap = {};
    data?.forEach(item => {
      const consultationId = item.consultation_id;
      unreadMap[consultationId] = (unreadMap[consultationId] || 0) + 1;
    });
    
    res.json({ success: true, data: unreadMap });
  } catch (error) {
    console.error('Error getting unread count by consultation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tandai semua pesan sebagai sudah dibaca per konsultasi
export const markAsReadByConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.id;
    
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .update({ is_read: true })
      .eq('consultation_id', consultationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};