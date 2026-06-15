import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../utils/api";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const loadCartCount = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      const total = cart.reduce((sum, item) => sum + item.jumlah, 0);
      setCartCount(total);
    } else {
      setCartCount(0);
    }
  };

  const fetchPendingPaymentCount = async () => {
    if (!user || user.role !== "pasien") return;
    try {
      const res = await api.get(`/orders/user/${user.id}`);
      const orders = res.data.data || [];
      const pendingCount = orders.filter(
        (order) => order.status_pembayaran === "pending",
      ).length;
      setPendingPaymentCount(pendingCount);
    } catch (err) {
      console.error("Error fetching pending payments:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      if (user.role === "pasien") {
        loadCartCount();
        fetchPendingPaymentCount();
      }
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "cart") loadCartCount();
    };
    const handleCartUpdate = () => loadCartCount();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleCartUpdate);

    const interval = setInterval(() => {
      if (user && user.role === "pasien") fetchPendingPaymentCount();
    }, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/chat/unread/count");
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDoctor = user?.role === "dokter";
  const isAdmin = user?.role === "admin";
  const isPatient = user?.role === "pasien";

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <span className="text-xl font-bold text-emerald-600">T-Medic</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="text-gray-600 hover:text-emerald-600 transition"
                >
                  Admin Panel
                </Link>
              </>
            )}
            {isDoctor && (
              <Link
                to="/doctor/dashboard"
                className="text-gray-600 hover:text-emerald-600 transition"
              >
                Dashboard
              </Link>
            )}
            {isPatient && (
              <>
                <Link
                  to="/patient/dashboard"
                  className="text-gray-600 hover:text-emerald-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/doctors"
                  className="text-gray-600 hover:text-emerald-600 transition"
                >
                  Dokter
                </Link>
                <Link
                  to="/medicines"
                  className="text-gray-600 hover:text-emerald-600 transition"
                >
                  Obat
                </Link>
                <Link
                  to="/apply-doctor"
                  className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-sm hover:bg-emerald-100 transition"
                >
                  Jadi Dokter
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Chat Icon - SEMUA ROLE */}
                <button
                  onClick={() => navigate("/consultations/history")}
                  className="relative p-2 text-gray-500 hover:text-emerald-600 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Cart Icon - HANYA UNTUK PASIEN */}
                {isPatient && (
                  <button
                    onClick={() => navigate("/cart")}
                    className="relative p-2 text-gray-500 hover:text-emerald-600 transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M18 13l1.5 6M9 21h6M12 18v3"
                      />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Orders Icon - HANYA UNTUK PASIEN */}
                {isPatient && (
                  <button
                    onClick={() => navigate("/orders")}
                    className="relative p-2 text-gray-500 hover:text-emerald-600 transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    {pendingPaymentCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        {pendingPaymentCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Settings Icon - SEMUA ROLE */}
                <button
                  onClick={() => navigate("/settings")}
                  className="p-2 text-gray-500 hover:text-emerald-600 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>

                {/* User Avatar */}

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-emerald-600 px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Register
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-emerald-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && user && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              {isPatient && (
                <>
                  <Link
                    to="/patient/dashboard"
                    className="text-gray-600 hover:text-emerald-600 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/doctors"
                    className="text-gray-600 hover:text-emerald-600 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dokter
                  </Link>
                  <Link
                    to="/medicines"
                    className="text-gray-600 hover:text-emerald-600 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Obat
                  </Link>
                  <Link
                    to="/apply-doctor"
                    className="text-emerald-600 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Jadi Dokter
                  </Link>
                </>
              )}
              {isDoctor && (
                <Link
                  to="/doctor/dashboard"
                  className="text-gray-600 hover:text-emerald-600 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard Dokter
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="text-gray-600 hover:text-emerald-600 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                  <Link
                    to="/admin/applications"
                    className="text-gray-600 hover:text-emerald-600 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pengajuan Dokter
                  </Link>
                </>
              )}
              <Link
                to="/orders"
                className="text-gray-600 hover:text-emerald-600 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Riwayat Pesanan
              </Link>
              <Link
                to="/consultations/history"
                className="text-gray-600 hover:text-emerald-600 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Riwayat Chat
              </Link>
              <Link
                to="/settings"
                className="text-gray-600 hover:text-emerald-600 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pengaturan
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-500 text-left py-2"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
