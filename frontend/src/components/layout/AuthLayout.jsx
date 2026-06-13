import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const AuthLayout = ({ children }) => {
  const location = useLocation();
  const [isLeaving, setIsLeaving] = useState(false);
  const [nextPath, setNextPath] = useState("");

  useEffect(() => {
    // Simpan path yang dituju
    setNextPath(location.pathname);

    // Trigger animasi keluar
    setIsLeaving(true);

    // Setelah animasi keluar selesai, reload content
    const timer = setTimeout(() => {
      setIsLeaving(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isLogin = location.pathname === "/login";
  const isRegister = location.pathname === "/register";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background blur effect saat transisi */}
      {isLeaving && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 animate-fade-out" />
      )}

      {/* Konten utama */}
      <div
        className={`transition-all duration-400 ${
          isLeaving ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        {children}
      </div>

      <style>{`
        @keyframes slideOut {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(${isLogin ? "-100%" : "100%"});
            opacity: 0;
          }
        }
        
        @keyframes slideIn {
          0% {
            transform: translateX(${isRegister ? "100%" : "-100%"});
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          0% {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          100% {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }
        
        .animate-slide-out {
          animation: slideOut 0.4s ease-in forwards;
        }
        
        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
        
        .animate-fade-out {
          animation: fadeOut 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
