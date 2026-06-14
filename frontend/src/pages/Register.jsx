import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";

const Register = () => {
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    nomor_telepon: "",
    alamat: "",
    role: "pasien",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const validateNama = (nama) => {
    if (!nama) return "Nama lengkap harus diisi";
    if (nama.length < 3) return "Nama minimal 3 karakter";
    return "";
  };

  const validateEmail = (email) => {
    if (!email) return "Email harus diisi";
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) return "Format email tidak valid";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password harus diisi";
    if (password.length < 6) return "Password minimal 6 karakter";
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Konfirmasi password harus diisi";
    if (confirmPassword !== password) return "Password tidak cocok";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTouched({ ...touched, [name]: true });

    let errorMsg = "";
    if (name === "nama") errorMsg = validateNama(value);
    if (name === "email") errorMsg = validateEmail(value);
    if (name === "password") errorMsg = validatePassword(value);
    if (name === "confirmPassword")
      errorMsg = validateConfirmPassword(value, formData.password);
    setErrors({ ...errors, [name]: errorMsg });
  };

  const validateForm = () => {
    const namaError = validateNama(formData.nama);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password,
    );

    setErrors({
      nama: namaError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmError,
    });
    return !namaError && !emailError && !passwordError && !confirmError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await api.post("/auth/register", submitData);

      if (response.data.success) {
        setShowVerification(true);
        let timer = 5;
        const interval = setInterval(() => {
          timer--;
          setCountdown(timer);
          if (timer === 0) {
            clearInterval(interval);
            navigate("/login");
          }
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (!formData.email) {
      alert("Masukkan email terlebih dahulu");
      return;
    }
    setResendLoading(true);
    try {
      await api.post("/auth/resend-verification", { email: formData.email });
      alert(
        "✅ Email verifikasi telah dikirim ulang. Cek inbox atau SPAM Anda.",
      );
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengirim ulang email");
    } finally {
      setResendLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-emerald-800 mb-2">
            📧 Cek Email Anda
          </h2>
          <p className="text-gray-600 mb-3">
            Kami telah mengirimkan link verifikasi ke:
          </p>
          <p className="font-semibold text-emerald-600 mb-4">
            {formData.email}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-amber-700 text-sm font-medium mb-2">
              📌 Perhatian:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • Cek folder <span className="font-semibold">INBOX</span> atau{" "}
                <span className="font-semibold">SPAM</span> di Gmail Anda
              </li>
              <li>• Klik link verifikasi untuk mengaktifkan akun</li>
            </ul>
          </div>
          <button
            onClick={resendEmail}
            disabled={resendLoading}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-3"
          >
            {resendLoading ? "Mengirim..." : "📧 Kirim Ulang Email Verifikasi"}
          </button>
          <div className="text-center mt-3">
            <p className="text-gray-500 text-sm">
              Mengalihkan ke login dalam{" "}
              <span className="font-bold text-emerald-600">{countdown}</span>{" "}
              detik
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div
                className="bg-emerald-600 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Langsung ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-md">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Buat Akun</h2>
          <p className="text-gray-500 text-sm mt-1">
            Daftar untuk konsultasi kesehatan online
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              onBlur={() => setTouched({ ...touched, nama: true })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${touched.nama && errors.nama ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              placeholder="Nama lengkap"
            />
            {touched.nama && errors.nama && (
              <p className="text-red-500 text-xs mt-1">{errors.nama}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => setTouched({ ...touched, email: true })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${touched.email && errors.email ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              placeholder="nama@email.com"
            />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => setTouched({ ...touched, password: true })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${touched.password && errors.password ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              placeholder="Minimal 6 karakter"
            />
            {touched.password && errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Konfirmasi Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${touched.confirmPassword && errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              placeholder="Masukkan ulang password"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                No. Telepon
              </label>
              <input
                type="tel"
                name="nomor_telepon"
                value={formData.nomor_telepon}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Alamat / Kota
              </label>
              <input
                type="text"
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Kota"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 mt-2"
          >
            {loading ? "Memproses..." : "Daftar & Verifikasi Email"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-gray-600 text-sm">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-emerald-600 font-semibold">
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
