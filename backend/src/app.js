import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import createDefaultAdmin from './utils/createAdmin.js';
import profileRoutes from './routes/profileRoutes.js';
import doctorApplicationRoutes from './routes/doctorApplicationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';





dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/doctor-applications', doctorApplicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'T-Medic API Running' });
});

app.use(errorMiddleware);

// Start server dengan create admin default
app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  
  // Buat admin default saat server start
  await createDefaultAdmin();
});