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

  const [errors, setErrors] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    nomor_telepon: "",
    alamat: "",
  });

  const [touched, setTouched] = useState({
    nama: false,
    email: false,
    password: false,
    confirmPassword: false,
    nomor_telepon: false,
    alamat: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  // Validasi Nama
  const validateNama = (nama) => {
    if (!nama) return "Nama lengkap harus diisi";
    if (nama.length < 3) return "Nama minimal 3 karakter";
    if (nama.length > 50) return "Nama maksimal 50 karakter";
    if (!/^[a-zA-Z\s]+$/.test(nama))
      return "Nama hanya boleh berisi huruf dan spasi";
    return "";
  };

  // Validasi Email
  const validateEmail = (email) => {
    if (!email) return "Email harus diisi";
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email))
      return "Format email tidak valid (contoh: nama@domain.com)";
    if (email.length > 100) return "Email maksimal 100 karakter";
    return "";
  };

  // Validasi Password
  const validatePassword = (password) => {
    if (!password) return "Password harus diisi";
    if (password.length < 6) return "Password minimal 6 karakter";
    if (password.length > 50) return "Password maksimal 50 karakter";
    if (!/[A-Z]/.test(password))
      return "Password harus mengandung minimal 1 huruf besar";
    if (!/[a-z]/.test(password))
      return "Password harus mengandung minimal 1 huruf kecil";
    if (!/[0-9]/.test(password))
      return "Password harus mengandung minimal 1 angka";
    return "";
  };

  // Validasi Konfirmasi Password
  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Konfirmasi password harus diisi";
    if (confirmPassword !== password) return "Password tidak cocok";
    return "";
  };

  // Validasi Nomor Telepon
  const validatePhone = (phone) => {
    if (!phone) return ""; // Optional
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(phone)) return "Nomor telepon harus 10-13 digit angka";
    return "";
  };

  // Validasi Alamat
  const validateAlamat = (alamat) => {
    if (!alamat) return ""; // Optional
    if (alamat.length > 200) return "Alamat maksimal 200 karakter";
    return "";
  };

  // Handle Change dengan validasi realtime
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTouched({ ...touched, [name]: true });

    // Validasi realtime
    let errorMsg = "";
    switch (name) {
      case "nama":
        errorMsg = validateNama(value);
        break;
      case "email":
        errorMsg = validateEmail(value);
        break;
      case "password":
        errorMsg = validatePassword(value);
        // Jika password berubah, validasi ulang confirmPassword
        if (formData.confirmPassword) {
          const confirmError = validateConfirmPassword(
            formData.confirmPassword,
            value,
          );
          setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
        }
        break;
      case "confirmPassword":
        errorMsg = validateConfirmPassword(value, formData.password);
        break;
      case "nomor_telepon":
        errorMsg = validatePhone(value);
        break;
      case "alamat":
        errorMsg = validateAlamat(value);
        break;
      default:
        break;
    }
    setErrors({ ...errors, [name]: errorMsg });
  };

  // Handle Blur untuk validasi
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });

    let errorMsg = "";
    switch (name) {
      case "nama":
        errorMsg = validateNama(value);
        break;
      case "email":
        errorMsg = validateEmail(value);
        break;
      case "password":
        errorMsg = validatePassword(value);
        break;
      case "confirmPassword":
        errorMsg = validateConfirmPassword(value, formData.password);
        break;
      case "nomor_telepon":
        errorMsg = validatePhone(value);
        break;
      case "alamat":
        errorMsg = validateAlamat(value);
        break;
      default:
        break;
    }
    setErrors({ ...errors, [name]: errorMsg });
  };

  // Validasi semua field sebelum submit
  const validateForm = () => {
    const namaError = validateNama(formData.nama);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password,
    );
    const phoneError = validatePhone(formData.nomor_telepon);
    const alamatError = validateAlamat(formData.alamat);

    setErrors({
      nama: namaError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmError,
      nomor_telepon: phoneError,
      alamat: alamatError,
    });

    setTouched({
      nama: true,
      email: true,
      password: true,
      confirmPassword: true,
      nomor_telepon: true,
      alamat: true,
    });

    return (
      !namaError &&
      !emailError &&
      !passwordError &&
      !confirmError &&
      !phoneError &&
      !alamatError
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Mohon lengkapi data dengan benar");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Hapus confirmPassword sebelum dikirim ke backend
      const { confirmPassword, ...submitData } = formData;
      const response = await api.post("/auth/register", submitData);

      if (response.data.success) {
        setSuccess(response.data.message);
        setShowVerification(true);

        setFormData({
          nama: "",
          email: "",
          password: "",
          confirmPassword: "",
          nomor_telepon: "",
          alamat: "",
          role: "pasien",
        });

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
      const errorMessage = err.response?.data?.message || "Registration failed";
      if (errorMessage.includes("already registered")) {
        setError(
          "Email sudah terdaftar. Silakan login atau gunakan email lain.",
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 z-10 border border-white/30 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600"
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
          <h2 className="text-xl font-bold text-emerald-800 mb-2">
            📧 Cek Email Anda
          </h2>
          <p className="text-gray-600 text-sm mb-3">
            Kami telah mengirimkan link verifikasi ke:
          </p>
          <p className="font-semibold text-emerald-600 text-sm mb-4">
            {formData.email || "email Anda"}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-left">
            <p className="text-amber-700 text-xs font-medium mb-1">
              📌 Perhatian:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Cek folder INBOX atau SPAM di Gmail Anda</li>
              <li>• Klik link verifikasi untuk mengaktifkan akun</li>
            </ul>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">
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
            className="mt-4 text-emerald-600 hover:text-emerald-700 text-xs font-medium"
          >
            ← Langsung ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-8 px-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-56 h-56 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>
      </div>

      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-5 z-10 border border-white/30">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <svg
                className="w-7 h-7 text-white"
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
          <h2 className="text-xl font-bold text-gray-800">Buat Akun</h2>
          <p className="text-gray-500 text-xs mt-1">
            Daftar untuk konsultasi kesehatan online
          </p>
        </div>

        {(error || success) && (
          <div
            className={`${error ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-600"} border rounded-lg px-3 py-2 mb-4 flex items-start gap-2 text-xs`}
          >
            <svg
              className="w-3 h-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  error
                    ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                }
              />
            </svg>
            <span>{error || success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all duration-200 ${
                  touched.nama && errors.nama
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-white/50"
                }`}
                placeholder="Nama lengkap"
              />
            </div>
            {touched.nama && errors.nama && (
              <p className="text-red-500 text-[10px] mt-0.5 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.nama}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all duration-200 ${
                  touched.email && errors.email
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-white/50"
                }`}
                placeholder="nama@email.com"
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-red-500 text-[10px] mt-0.5 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.email}
              </p>
            )}
            {!touched.email && (
              <p className="text-gray-400 text-[10px] mt-0.5">
                Email verifikasi akan dikirim
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all duration-200 ${
                  touched.password && errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-white/50"
                }`}
                placeholder="Minimal 6 karakter"
              />
            </div>
            {touched.password && errors.password && (
              <p className="text-red-500 text-[10px] mt-0.5 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.password}
              </p>
            )}
            {!touched.password && (
              <p className="text-gray-400 text-[10px] mt-0.5">
                Minimal 6 karakter, huruf besar, kecil, dan angka
              </p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">
              Konfirmasi Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all duration-200 ${
                  touched.confirmPassword && errors.confirmPassword
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-white/50"
                }`}
                placeholder="Masukkan ulang password"
              />
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-red-500 text-[10px] mt-0.5 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Grid 2 kolom untuk No Telepon & Alamat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">
                No. Telepon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-3.5 w-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <input
                  type="tel"
                  name="nomor_telepon"
                  value={formData.nomor_telepon}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all duration-200 ${
                    touched.nomor_telepon && errors.nomor_telepon
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white/50"
                  }`}
                  placeholder="08123456789"
                />
              </div>
              {touched.nomor_telepon && errors.nomor_telepon && (
                <p className="text-red-500 text-[10px] mt-0.5">
                  {errors.nomor_telepon}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">
                Alamat / Kota
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-3.5 w-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all duration-200 ${
                    touched.alamat && errors.alamat
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white/50"
                  }`}
                  placeholder="Kota"
                />
              </div>
              {touched.alamat && errors.alamat && (
                <p className="text-red-500 text-[10px] mt-0.5">
                  {errors.alamat}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 disabled:opacity-50 text-sm shadow-md hover:shadow-lg mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Memproses...
              </span>
            ) : (
              "Daftar & Verifikasi Email"
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-xs">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Login di sini
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Register;
