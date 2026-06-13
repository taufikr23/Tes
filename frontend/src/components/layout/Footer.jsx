import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">T-Medic</h3>
            <p className="text-gray-400 text-sm">
              Solusi kesehatan digital untuk konsultasi online dan pembelian
              obat terpercaya.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Layanan</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Konsultasi Dokter</li>
              <li>Pembelian Obat</li>
              <li>Resep Digital</li>
              <li>Riwayat Kesehatan</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Tentang</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Tentang Kami</li>
              <li>Kebijakan Privasi</li>
              <li>Syarat & Ketentuan</li>
              <li>Bantuan</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Kontak</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: support@t-medic.com</li>
              <li>Telepon: (021) 1234-5678</li>
              <li>WhatsApp: 0812-3456-7890</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; 2026 T-Medic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
