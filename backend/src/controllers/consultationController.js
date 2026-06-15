import { supabaseAdmin } from '../utils/supabaseClient.js';

export const createConsultation = async (req, res) => {
  try {
    const { user_id, doctor_id, keluhan } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .insert([{
        user_id,
        doctor_id,
        keluhan,
        status_konsultasi: 'pending'
      }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsultationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .select(`
        *,
        doctors!doctor_id (
          id,
          user_id,
          nama_dokter,
          spesialis,
          foto_url,
          biaya_konsultasi,
          jadwal_praktik
        ),
        consultation_payments (
          id,
          payment_status,
          amount
        ),
        prescriptions (
          *,
          medicines (
            id,
            nama_obat,
            harga
          )
        )
      `)
      .eq('user_id', userId)
      .order('tanggal_konsultasi', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsultationsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .select(`
        *,
        profiles!user_id (
          id, 
          nama, 
          email, 
          nomor_telepon, 
          foto_url,
          role
        )
      `)
      .eq('doctor_id', doctorId)
      .order('tanggal_konsultasi', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { hasil_diagnosa, status_konsultasi } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .update({ hasil_diagnosa, status_konsultasi })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addPrescription = async (req, res) => {
  try {
    const { consultation_id, medicine_id, dosis, aturan_pakai } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('prescriptions')
      .insert([{
        consultation_id,
        medicine_id,
        dosis,
        aturan_pakai
      }])
      .select();
    
    if (error) throw error;
    
    await supabaseAdmin
      .from('consultations')
      .update({ status_konsultasi: 'completed' })
      .eq('id', consultation_id);
    
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};