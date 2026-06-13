import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-cyan-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              T-Medic
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 font-semibold text-sm">
                      {user.nama?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 hidden md:inline">
                    Halo, {user.nama?.split(" ")[0]}
                  </span>
                </div>

                <div className="hidden md:flex items-center space-x-2">
                  {user.role === "admin" && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className="text-gray-600 hover:text-cyan-600 px-3 py-2"
                      >
                        Admin Panel
                      </Link>
                      <Link
                        to="/admin/applications"
                        className="text-gray-600 hover:text-cyan-600 px-3 py-2"
                      >
                        Pengajuan Dokter
                      </Link>
                    </>
                  )}
                  {user.role === "dokter" && (
                    <Link
                      to="/doctor/dashboard"
                      className="text-gray-600 hover:text-cyan-600 px-3 py-2"
                    >
                      Dashboard Dokter
                    </Link>
                  )}
                  {user.role === "pasien" && (
                    <>
                      <Link
                        to="/patient/dashboard"
                        className="text-gray-600 hover:text-cyan-600 px-3 py-2"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/doctors"
                        className="text-gray-600 hover:text-cyan-600 px-3 py-2"
                      >
                        Dokter
                      </Link>
                      <Link
                        to="/medicines"
                        className="text-gray-600 hover:text-cyan-600 px-3 py-2"
                      >
                        Obat
                      </Link>
                      <Link
                        to="/apply-doctor"
                        className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 px-3 py-1 rounded-full text-sm"
                      >
                        Jadi Dokter
                      </Link>
                    </>
                  )}

                  {/* Menu Pengaturan untuk SEMUA USER */}
                  <Link
                    to="/settings"
                    className="text-gray-600 hover:text-cyan-600 px-3 py-2 flex items-center gap-1"
                  >
                    ⚙️ Pengaturan
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-cyan-600 px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
